$(document).ready(function() {
    //calling notionHqQuery on document ready
    window.requestInput = $('.notion-hq-input--input').val()
    notionHqQuery(window.requestInput)
    //.notion-hq-trigger--btn click
    $('.notion-hq-trigger--btn').on('click', function() {
        window.requestInput = $('.notion-hq-input--input').val()
        notionHqQuery(window.requestInput)
    })
    //.notion-hq-reset--btn click
    $('.notion-hq-reset--btn').click(function(){
        //default sent data
        var requestInput = JSON.stringify(
            {
                "function": "databasesQuery",
                "data": {
                    "databaseId": "4153efddccc84e3a80012ac7d36bbb2a",
                    "entryCategory": "all",
                    "entryArchivedInclude": true,
                    "entryMaxNumber": 5,
                    "entryDisplay": "grid"
                },
                "output": {
                    "element": ".notion-hq-output",
                    "console": {
                        "enable": true,
                        "element": ".notion-hq-output--formatted"
                    }
                },
                "pagination": {
                }
            },
            null,
            2
        )
        $('.notion-hq-input--input').val(requestInput)
        window.requestInput = $('.notion-hq-input--input').val()
        notionHqQuery(window.requestInput)
    })
    //on change functions of form elements and update the .notion-hq-input--input value
    //.entry-max-number change
    $('.entry-max-number').on("change",function() {
        var requestInput = JSON.parse($('.notion-hq-input--input').val())
        $('.entry-max-number-number').html($(this).val())
        requestInput.data.entryMaxNumber = JSON.parse($(this).val())
        $('.notion-hq-input--input').val(JSON.stringify(requestInput,null,2))
        window.requestInput = $('.notion-hq-input--input').val()
    })
    //.entry-category-select change
    $('.entry-category-select').on("change",function() {
        var requestInput = JSON.parse($('.notion-hq-input--input').val())
        requestInput.data.entryCategory = $(this).val()
        $('.notion-hq-input--input').val(JSON.stringify(requestInput,null,2))
        window.requestInput = $('.notion-hq-input--input').val()
    })
    //.entry-archived-include change
    $('.entry-archived-include').on("change",function() {
        var requestInput = JSON.parse($('.notion-hq-input--input').val())
        requestInput.data.entryArchivedInclude = $(this).is(':checked')
        $('.notion-hq-input--input').val(JSON.stringify(requestInput,null,2))
        window.requestInput = $('.notion-hq-input--input').val()
    })
    //.btn-check aka display type change
    $('.btn-check').on("change",function() {
        var requestInput = JSON.parse($('.notion-hq-input--input').val())
        requestInput.data.entryDisplay = $('.btn-check:checked').val()
        $('.notion-hq-input--input').val(JSON.stringify(requestInput,null,2))
        window.requestInput = $('.notion-hq-input--input').val()
    })
    //.console-enable change
    $('.console-enable').on("change",function() {
        var requestInput = JSON.parse($('.notion-hq-input--input').val())
        requestInput.output.console.enable = $(this).is(':checked')
        $('.notion-hq-input--input').val(JSON.stringify(requestInput,null,2))
        window.requestInput = $('.notion-hq-input--input').val()
    })
})
//basic functions
function spinner(el) {
    el.html(
        `
            <div class="d-flex justify-content-center">
                <div class="spinner-border spinner-border-sm text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `
    )
}
function filterNthElements(array, n) {
    return array.filter((_, index) => (index) % n === 0);
}
/*
Example usage:
const originalArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
return array.filter((_, index) => (index + 1) % n === 0);
const filteredArray = filterNthElements(originalArray, 3);
*/
/*
notionHqQuery
url: shift between local and remote workers, local managed by wrangler and remotely stored in cloudflare
    local   =>  'http://127.0.0.1:8787'
    remote  =>  'https://data.infiniteways.workers.dev'
dataType: data is sent as json to the server, but it reach there as object
contentType: default data sending and recieving MIME type although data is sent as json from the worker
data: data sent from the input as a json string no need for stringify it !IMPORTANT
success: recieved as object but sent as json from worker, xhr is our king!
*/
function notionHqQuery(requestInput) {
    var ajaxFunction =    $.ajax(
        {
            type: 'POST',
            method: 'POST',
            url: 'https://data.infiniteways.workers.dev',
            dataType:'json',
            contentType:'application/x-www-form-urlencoded; charset=UTF-8',
            data: requestInput,
            beforeSend: function() {//BEFORE SEND
                //getting the requestInput, the global variable
                var requestInput = JSON.parse(window.requestInput)
                //identifying function and making necessary beforeSend changes
                //databasesQuery
                if(requestInput.function == 'databasesQuery') {
                    $('.notion-hq-trigger--btn, .notion-hq-reset--btn').attr('disabled',true)
                    spinner($(requestInput.output.element))
                    spinner($(requestInput.output.console.element))
                    $(document).off("click",'.pagination-button--previous')
                    $(document).off("click",'.pagination-button--next')
                    $(document).off("click",'.page-train--button')
                    console.log(`notionHqQuery(requestInput) start`)
                }

            },
            success: function(xhr, status, result) {//SUCCESS
                var responseOutput = xhr.responseOutput
                //identifying function and making necessary success changes
                //databasesQuery
                if(responseOutput.function == 'databasesQuery') {
                    //extracting parameters to use in conditions
                    var _entry_category = responseOutput.data.entryCategory
                    var _entry_archived_include = responseOutput.data.entryArchivedInclude
                    var _entry_display = responseOutput.data.entryDisplay
                    var _response_data = responseOutput.data.responseData
                    //pagination parameters to use in conditions
                    var _pagination = responseOutput.pagination
                    var _full_list = _pagination.full_list
                    var _current_list = _pagination.current_list
                    var _page_size = _pagination.page_size
                    //output data defined, added more elements sequentially
                    var _outputData = `
                        <span class="d-block mb-3 h4"><i class="bi bi-check2-circle"></i> found ${_full_list.length} results in "${_entry_category}"</span>
                    `
                    if(!_entry_archived_include) {
                        _outputData += `<span class="d-block mb-3 h5">excluding archived</span>`
                    }
                    //creating display condition & loops
                    if(_entry_display == 'grid') {//grid display
                        _outputData += `<div class="row justify-content-center mb-3">`
                        for(let i = 0; i < _response_data.length; i++) {
                            if(_response_data[i].properties.Archived.checkbox){
                                var archiveText = '<span class="badge bg-secondary">Archived</span>'
                            }else{
                                var archiveText = ''
                            }
                            _outputData += `
                                <div class="col-lg-5 mb-2 me-2">
                                    <div class="card shadow-lg" style="overflow:hidden">
                                        <div class="card-img-c" style="height:150px;overflow:hidden;">
                                                <img src="${_response_data[i].cover.file.url}" class="card-img-top img-fluid position-relative top-50 start-50 translate-middle" alt="page image"/>
                                        </div>
                                        <div class="card-body">
                                            <h5 class="card-title mb-3">${_response_data[i].icon.emoji}&nbsp;${_response_data[i].properties.Name.title[0].plain_text}&nbsp;&nbsp;<span class="badge bg-secondary">${_response_data[i].properties.Category.select.name}</span>&nbsp;${archiveText}</h5>
                                            <h6 class="card-subtitle mb-2 text-body-secondary"><img src="${_response_data[i].properties.Author.people[0].avatar_url}" style="width:20px" alt="Author image" class="rounded-circle"/>&nbsp;&nbsp;${_response_data[i].properties.Author.people[0].name}</h6>
                                            <p class="card-text"><code class="text-muted" data-bs-toggle="tooltip" data-bs-placement="bottom" title="time">${_response_data[i].created_time}</code></p>
                                            <a class="btn btn-outline-primary btn-sm" target="new" href="${_response_data[i].public_url}">Open</a>
                                        </div>
                                        <div class="card-footer">
                                            <code class="card-subtitle mb-2 text-muted">${_response_data[i].id}</code>
                                        </div>
                                    </div>
                                </div>

                            `
                        }
                        _outputData += `</div>`
                    }else {//table display
                        _outputData += `
                            <table class="table border border-1 post-list-table sortable-theme-minimal" data-sortable>
                                <thead>
                                    <tr>
                                        <th class="d-none" scope="col">#</th>
                                        <th scope="col">Title</th>
                                        <th scope="col">Author</th>
                                        <th scope="col">Category</th>
                                        <th scope="col">Archived</th>
                                        <th scope="col">Date created</th>
                                        <th scope="col" class="d-none">ID</th>
                                        <th scope="col">Link</th>
                                    </tr>
                                </thead>
                        `
                        for(let i = 0; i < _response_data.length; i++) {
                            if(_response_data[i].properties.Archived.checkbox){
                                var archiveText = '<span class="badge bg-secondary">Archived</span>'
                            }else{
                                var archiveText = ''
                            }
                            _outputData += `
                                <tr data-id="${_response_data[i].id}">
                                    <th class="d-none" data-sortable="false" scope="row">${(i+1)}</th>
                                    <td><h6>${_response_data[i].icon.emoji}&nbsp;${_response_data[i].properties.Name.title[0].plain_text}</h6></td>
                                    <td><img src="${_response_data[i].properties.Author.people[0].avatar_url}" style="width:20px" alt="Author image" class="rounded-circle"/>&nbsp;&nbsp;${_response_data[i].properties.Author.people[0].name}</td>
                                    <td><span class="badge bg-secondary">${_response_data[i].properties.Category.select.name}</span></td>
                                    <td>${archiveText}</td>
                                    <td data-value="${_response_data[i].created_time}">${_response_data[i].created_time}</span></td>
                                    <td class="d-none"><pre>${_response_data[i].id}</pre></td>
                                    <td><a class="btn btn-outline-primary btn-sm" target="new" href="${_response_data[i].public_url}">Open</a></td>
                                </tr>
                            `
                        }
                        _outputData += `
                                </tbody>
                                <tfoot>
                                        <tr>
                                        <th data-sortable="false" colspan="8" class="text-center">${_full_list.length} results</th>
                                    </tr>
                                </tfoot>
                            </table>
                        `
                        //filter under development
                        /*async function returnBodySort(data) {//sort initialize and tooltip initialize
                                try {
                                        const res = await returnBodyFn(data)
                                        Sortable.init()
                                } catch(err) {
                                        console.log(err);
                                }
                        }
                        returnBodySort(data)*/
                    }
                    //pagination section
                    if(_full_list.length > _current_list.length) {
                        //derivations
                        var indexNow = _full_list.indexOf(_current_list[0])//finding the index of first visible element
                        var number_of_pages = Math.ceil(_full_list.length/_page_size)//approx number of pages
                        var indexPerc = indexNow/_full_list.length//approx percentage covered
                        var start_cursors = filterNthElements(_full_list,_page_size)//an array of all the index entries
                        var pageNow = Math.ceil(indexPerc*number_of_pages)//current page estimated
                        if (pageNow == 0) {//multiplication by 0 corrected
                            pageNow = 1
                        }
                        //adding pagination elements
                        _outputData += `
                            <nav aria-label="entry pagination">
                                <ul class="pagination justify-content-md-center">
                        `
                        //adding previous button
                        if(indexNow != 0) {
                            nextIndex = indexNow - _page_size
                            var prev_cursor = _full_list[nextIndex]
                            _outputData += `
                                <li class="page-item">
                                    <a href="javarscript:void(0)" aria-label="previous" data-prev="${prev_cursor}" class="page-link pagination-button--previous"><span aria-hidden="true">&laquo;</span></a>
                                </li>
                            `
                        }
                        //adding page train
                        var _pageTrain = ''
                        for(let i = 0; i < number_of_pages; i++) {
                            _pageTrain += `
                                <li class="page-item">
                                    <a href="javarscript:void(0)" data-start-cursor="${start_cursors[i]}" data-index="${i}" class="page-link page-train--button">${i+1}</a>
                                </li>
                            `
                        }
                        _outputData += _pageTrain
                        //adding next button
                        if(_pagination.has_more) {
                            _outputData += `
                                <li class="page-item">
                                    <a href="javarscript:void(0)" aria-label="next" data-next="${_pagination.next_cursor}" class="page-link pagination-button--next"><span aria-hidden="true">&raquo;</span></a>
                                </li>
                            `
                        }
                        _outputData += `
                                </div>
                            </nav>
                        `
                        //adding page indicator: hidden
                        _outputData += `
                            <div class="p-2 d-none pagination--indicator">page ${pageNow} / ${number_of_pages}</div>
                        `
                        //a focus tweak
                        setTimeout(function(){$('.page-train--button[data-index="'+(pageNow-1)+'"]').addClass('active')},1000)
                        //page train button trigger
                        $(document).on("click",'.page-train--button', function() {
                            var requestInput = JSON.parse(window.requestInput)
                            requestInput.pagination.enable = true
                            requestInput.pagination.start_cursor = $(this).attr('data-start-cursor')
                            requestInput = JSON.stringify(requestInput,null,2)
                            $('.notion-hq-input--input').val(requestInput)
                            window.requestInput = requestInput
                            notionHqQuery(window.requestInput)
                        })
                        //prev button trigger
                        $(document).on("click",'.pagination-button--previous', function() {
                            var requestInput = JSON.parse(window.requestInput)
                            requestInput.pagination.enable = true
                            requestInput.pagination.start_cursor = $(this).attr('data-prev')
                            requestInput = JSON.stringify(requestInput,null,2)
                            $('.notion-hq-input--input').val(requestInput)
                            window.requestInput = requestInput
                            notionHqQuery(window.requestInput)
                        })
                        //next button trigger
                        $(document).on("click",'.pagination-button--next', function() {
                            var requestInput = JSON.parse(window.requestInput)
                            requestInput.pagination.enable = true
                            requestInput.pagination.start_cursor = $(this).attr('data-next')
                            requestInput = JSON.stringify(requestInput,null,2)
                            $('.notion-hq-input--input').val(requestInput)
                            window.requestInput = requestInput
                            notionHqQuery(window.requestInput)
                        })
                    }
                }//databasesQuery end
                //outputing the data
                $(responseOutput.output.element).html(_outputData)
                //on page console
                if(responseOutput.output.console.enable) {//enable console and diagnostics
                    var formatterConfig = {
                        hoverPreviewEnabled: false,
                        hoverPreviewArrayCount: 100,
                        hoverPreviewFieldCount: 5,
                        theme: 'dark',
                        animateOpen: true,
                        animateClose: true,
                        useToJSON: true
                    }
                    result.responseText = "truncated"
                    //console.log([{xhr}, {status}, {result}])
                    //const formatter = new JSONFormatter([{xhr}, {status}, {result}],3,formatterConfig);
                    const formatter = new JSONFormatter({xhr},3,formatterConfig);
                    $(responseOutput.output.console.element).html(formatter.render()).show()
                }else{
                    $(responseOutput.output.console.element).html('').hide()
                }
            },
            error: function(xhr, status, error) {//ERROR
                console.log([{xhr}, {status}, {error}])
                console.log('notionHqQuery() error')
            },
            complete: function() {//COMPLETE
                $('.notion-hq-trigger--btn, .notion-hq-reset--btn').attr('disabled',false)
                console.log('notionHqQuery() complete')
            },
        }
    )
    return ajaxFunction
}
