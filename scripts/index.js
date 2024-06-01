$(document).ready(function() {
    //notion forms trigger buttons event handlers
    //.notion-databases-trigger--trigger click
    $('.notion-databases-trigger--trigger').on('click', function() {
        var requestInput = $('.notion-databases-input--input').val()
        notionHqQuery(requestInput)
    })
    //.notion-databases-trigger--reset click
    $('.notion-databases-trigger--reset').click(function(){
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
                    "element": ".notion-databases-output",
                    "console": {
                        "enable": true,
                        "element": ".notion-databases-output--formatted"
                    }
                },
                "pagination": {
                }
            },
            null,
            2
        )
        notionHqQuery(requestInput)
    })
    //.notion-pages-trigger--trigger click
    $('.notion-pages-trigger--trigger').on('click', function(){
        var requestInput = {
            function: 'pagesQuery',
            data: {
                pageId: $('.notion-pages-input--page-id').val()
            },
            output: {
                element: $('.notion-pages-input--output-element').val(),
                console: {
                    enable: $('.notion-pages-input--console-enable').is(':checked'),
                    element: '.notion-hq-output--formatted'//not planned to change
                }
            }
        }
        requestInput = JSON.stringify(requestInput,null,2)
        notionHqQuery(requestInput)
    })
    //on change event handlers of form elements and update the .notion-databases-input--input value
    //.notion-databases-input--entry-max-number change
    $('.notion-databases-input--entry-max-number').on("change",function() {
        var requestInput = JSON.parse($('.notion-databases-input--input').val())
        $('.notion-databases-input--entry-max-number-number').html($(this).val())
        requestInput.data.entryMaxNumber = JSON.parse($(this).val())
        $('.notion-databases-input--input').val(JSON.stringify(requestInput,null,2))
    })
    //.notion-databases-input--entry-category-select change
    $('.notion-databases-input--entry-category-select').on("change",function() {
        var requestInput = JSON.parse($('.notion-databases-input--input').val())
        requestInput.data.entryCategory = $(this).val()
        $('.notion-databases-input--input').val(JSON.stringify(requestInput,null,2))
    })
    //.notion-databases-input--entry-archived-include change
    $('.notion-databases-input--entry-archived-include').on("change",function() {
        var requestInput = JSON.parse($('.notion-databases-input--input').val())
        requestInput.data.entryArchivedInclude = $(this).is(':checked')
        $('.notion-databases-input--input').val(JSON.stringify(requestInput,null,2))
    })
    //.notion-databases-input--entry-display change
    $('.notion-databases-input--entry-display').on("change",function() {
        var requestInput = JSON.parse($('.notion-databases-input--input').val())
        requestInput.data.entryDisplay = $('.notion-databases-input--entry-display:checked').val()
        $('.notion-databases-input--input').val(JSON.stringify(requestInput,null,2))
    })
    //.notion-databases-input--console-enable change
    $('.notion-databases-input--console-enable').on("change",function() {
        var requestInput = JSON.parse($('.notion-databases-input--input').val())
        requestInput.output.console.enable = $(this).is(':checked')
        $('.notion-databases-input--input').val(JSON.stringify(requestInput,null,2))
    })
})
//basic functions
//a spinner
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
//a progressbar
function progress(el, fn) {
    if(fn=='notionHqQuery') {
        el.html(
            `
                <div class="progress" style="height:5px" role="progressbar" aria-label="Notion Hq Query Progress" aria-valuenow="75" aria-valuemin="0" aria-valuemax="100">
                    <div class="progress-bar notion-hq-query-progress-bar" style="width: 0%"></div>
                </div>
            `
        )
    }
}
/*
filter an array at intervals
Example usage:
const originalArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
return array.filter((_, index) => (index + 1) % n === 0);
const filteredArray = filterNthElements(originalArray, 3);
*/
function filterNthElements(array, n) {
    return array.filter((_, index) => (index) % n === 0);
}
//objectify form
function objectifyForm(formArray) {
    //serialize data function
    var returnArray = {};
    for (var i = 0; i < formArray.length; i++){
        returnArray[formArray[i]['name']] = formArray[i]['value'];
    }
    return returnArray;
}
/*
notionHqQuery(requestInput) with progress
------------------------
url: shift between local and remote workers, local managed by wrangler and remotely stored in cloudflare
    local   =>  'http://127.0.0.1:8787'
    remote  =>  'https://data.infiniteways.workers.dev'
dataType: data is sent as json to the server, but it reach there as object
contentType: default data sending and recieving MIME type although data is sent as json from the worker
data: data sent from the input as a json string no need for stringify it !IMPORTANT
success: recieved as object but sent as json from worker, xhr is our king!
*/
function notionHqQueryRequest(requestInput) {
    var ajaxPromise = new Promise(
        function(resolveA, reject){
            var ajaxFunction = $.ajax(
                {   
                    //BASIC SETTINGS
                    type: 'POST',
                    method: 'POST',
                    url: 'https://data.infiniteways.workers.dev',
                    data: requestInput,
                    //BEFORE SEND
                    beforeSend: function(xhr, settings) {
                        //getting the requestInput as settings.data, where settings is the settings of this ajax object
                        var requestInput = JSON.parse(settings.data)
                        $('.notion-databases-trigger--trigger, .notion-databases-trigger--reset, .notion-pages-trigger--trigger').attr('disabled',true)
                        //manipulating necessary output elements with jquery animations
                        $('.notion-hq-output'+requestInput.output.element).slideDown()
                        $('.notion-hq-output').not(requestInput.output.element).slideUp()
                        if(requestInput.output.console.enable) {
                            $(requestInput.output.console.element).slideDown()
                            spinner($(requestInput.output.console.element))
                        }else {
                            $(requestInput.output.console.element).slideUp()
                        }
                        //adding a progress bar to output element
                        progress($(requestInput.output.element),'notionHqQuery')
                        //identifying function and making necessary beforeSend changes
                        //databasesQuery
                        if(requestInput.function == 'databasesQuery') {
                            //resetting the event handlers of dynamically load contents
                            $(document).off('click','.notion-databases-pagination--page-load-button')
                            $(document).off("click",'.notion-databases-pagination--button-previous')
                            $(document).off("click",'.notion-databases-pagination--button-next')
                            $(document).off("click",'.notion-databases-pagination--page-train-button')
                            console.log(`notionHqQuery() databasesQuery start`)
                        }
                        //pagesQuery
                        if(requestInput.function == 'pagesQuery') {
                            console.log(`notionHqQuery() pagesQuery start`)
                        }

                    },
                    //SUCCESS
                    success: function(xhr, status, result) {
                        console.log('notionHqQuery() success')
                    },
                    //COMPLETE
                    complete: function(xhr, status) {
                        $('.notion-databases-trigger--trigger, .notion-databases-trigger--reset, .notion-pages-trigger--trigger').attr('disabled',false)
                        console.log('notionHqQuery() complete')
                    },
                    //XHR specifically for progress
                    xhr: function () {
                        var xhr = new window.XMLHttpRequest();
                        var progressPromise = new Promise(function(resolveProgress, rejectProgress) {
                            // Listen to the progress event
                            xhr.addEventListener("progress", function (evt) {
                                if (evt.lengthComputable) {
                                    // Calculate the progress percentage
                                    var perc = (evt.loaded / evt.total) * 100;
                                }
                                $('.notion-hq-query-progress-bar').animate(
                                    {
                                        'width': perc+'%',
                                    },
                                    1000,
                                    function() {
                                        console.log('load complete')
                                        //xhr.responseJSON
                                        //xhr.responseText
                                        //resolve progress with response
                                        resolveProgress(xhr.responseText)
                                    }
                                )
                            }, false);
                        })
                        // Resolve the main promise when progress animation completes
                        progressPromise.then(resolveA)
                        return xhr;
                    },
                    //ERROR
                    error: function(xhr, status, error) {//ERROR
                        reject([{xhr}, {status}, {error}])
                        console.log('notionHqQuery() error')
                    },
                }
            )
            return ajaxFunction
        }
    )
    return ajaxPromise
}
function notionHqQuery(requestInput) {
    notionHqQueryRequest(requestInput).then(//Promise of animation complete
        function(xhr) {
            //extracting the request output
            var xhr = JSON.parse(xhr)
            var responseOutput = xhr.responseOutput
            var requestInput = xhr.requestInput
            //identifying function and making necessary success changes
            //databasesQuery
            if(responseOutput.function == 'databasesQuery') {
                //extracting parameters to use in conditions
                var entryCategory = responseOutput.data.entryCategory
                var entryArchivedInclude = responseOutput.data.entryArchivedInclude
                var entryDisplay = responseOutput.data.entryDisplay
                var responseData = responseOutput.data.responseData
                //pagination parameters to use in conditions
                var pagination = responseOutput.pagination
                var fullList = pagination.fullList
                var currentList = pagination.currentList
                var pageSize = pagination.pageSize
                //output data defined, added more elements sequentially
                var outputData = `
                    <span class="d-block mb-3 h4"><i class="bi bi-check2-circle"></i> found ${fullList.length} results in "${entryCategory}"</span>
                `
                if(!entryArchivedInclude) {
                    outputData += `<span class="d-block mb-3 h5">excluding archived</span>`
                }
                //creating display condition & loops
                if(entryDisplay == 'grid') {//grid display
                    outputData += `<div class="row justify-content-center mb-3">`
                    for(let i = 0; i < responseData.length; i++) {
                        if(responseData[i].properties.Archived.checkbox){
                            var archiveText = '<span class="badge bg-secondary">Archived</span>'
                        }else{
                            var archiveText = ''
                        }
                        outputData += `
                            <div class="col-lg-5 mb-2 me-2">
                                <div class="card shadow-lg" style="overflow:hidden">
                                    <div class="card-img-c" style="height:150px;overflow:hidden;">
                                            <img src="${responseData[i].cover.file.url}" class="card-img-top img-fluid position-relative top-50 start-50 translate-middle" alt="page image"/>
                                    </div>
                                    <div class="card-body">
                                        <h5 class="card-title mb-3">${responseData[i].icon.emoji}&nbsp;${responseData[i].properties.Name.title[0].plain_text}&nbsp;&nbsp;<span class="badge bg-secondary">${responseData[i].properties.Category.select.name}</span>&nbsp;${archiveText}</h5>
                                        <h6 class="card-subtitle mb-2 text-body-secondary"><img src="${responseData[i].properties.Author.people[0].avatar_url}" style="width:20px" alt="Author image" class="rounded-circle"/>&nbsp;&nbsp;${responseData[i].properties.Author.people[0].name}</h6>
                                        <p class="card-text"><code class="text-muted" data-bs-toggle="tooltip" data-bs-placement="bottom" title="time">${responseData[i].created_time}</code></p>
                                        <a data-id="${responseData[i].id}" class="btn btn-outline-primary btn-sm page-load-button" href="javascript:void(0);">Open</a>
                                    </div>
                                    <div class="card-footer">
                                        <code class="card-subtitle mb-2 text-muted">${responseData[i].id}</code>
                                    </div>
                                </div>
                            </div>

                        `
                    }
                    outputData += `</div>`
                }else {//table display
                    outputData += `
                        <table class="table border border-1 post-list-table sortable-theme-minimal" data-sortable>
                            <thead>
                                <tr>
                                    <th class="d-none" scope="col">javascript:void(0);</th>
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
                    for(let i = 0; i < responseData.length; i++) {
                        if(responseData[i].properties.Archived.checkbox){
                            var archiveText = '<span class="badge bg-secondary">Archived</span>'
                        }else{
                            var archiveText = ''
                        }
                        outputData += `
                            <tr data-id="${responseData[i].id}">
                                <th class="d-none" data-sortable="false" scope="row">${(i+1)}</th>
                                <td><h6>${responseData[i].icon.emoji}&nbsp;${responseData[i].properties.Name.title[0].plain_text}</h6></td>
                                <td><img src="${responseData[i].properties.Author.people[0].avatar_url}" style="width:20px" alt="Author image" class="rounded-circle"/>&nbsp;&nbsp;${responseData[i].properties.Author.people[0].name}</td>
                                <td><span class="badge bg-secondary">${responseData[i].properties.Category.select.name}</span></td>
                                <td>${archiveText}</td>
                                <td data-value="${responseData[i].created_time}">${responseData[i].created_time}</span></td>
                                <td class="d-none"><pre>${responseData[i].id}</pre></td>
                                <td><a data-id="${responseData[i].id}" class="btn btn-outline-primary btn-sm page-load-button" href="javascript:void(0);">Open</a></td>
                            </tr>
                        `
                    }
                    outputData += `
                            </tbody>
                            <tfoot>
                                    <tr>
                                    <th data-sortable="false" colspan="8" class="text-center">${fullList.length} results</th>
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
                function paginationProduce(fullList, currentList, pageSize) {
                    var promise = new Promise(
                        function(resolve, reject) {
                            if(fullList.length > currentList.length) {
                                //derivations
                                var indexNow = fullList.indexOf(currentList[0])//finding the index of first visible element
                                var numberOfPages = Math.ceil(fullList.length/pageSize)//approx number of pages
                                var indexPerc = indexNow/fullList.length//approx percentage covered
                                var startCursors = filterNthElements(fullList,pageSize)//an array of all the index entries
                                var pageNow = Math.ceil(indexPerc*numberOfPages)//current page estimated
                                if (pageNow == 0) {//multiplication by 0 corrected
                                    pageNow = 1
                                }
                                //adding pagination elements
                                outputData += `
                                    <nav aria-label="entry pagination notion-databases-pagination">
                                        <ul class="pagination justify-content-md-center">
                                `
                                //adding previous button
                                if(indexNow != 0) {
                                    nextIndex = indexNow - pageSize
                                    var prevCursor = fullList[nextIndex]
                                    outputData += `
                                        <li class="page-item">
                                            <a href="javascript:void(0);" aria-label="previous" data-prev="${prevCursor}" class="page-link notion-databases-pagination--button-previous"><span aria-hidden="true">&laquo;</span></a>
                                        </li>
                                    `
                                }
                                //adding page train
                                var pageTrain = ''
                                for(let i = 0; i < numberOfPages; i++) {
                                    pageTrain += `
                                        <li class="page-item">
                                            <a href="javascript:void(0);" data-start-cursor="${startCursors[i]}" data-index="${i}" class="page-link notion-databases-pagination--page-train-button">${i+1}</a>
                                        </li>
                                    `
                                }
                                outputData += pageTrain
                                //adding next button
                                if(pagination.hasMore) {
                                    outputData += `
                                        <li class="page-item">
                                            <a href="javascript:void(0);" aria-label="next" data-next="${pagination.nextCursor}" class="page-link notion-databases-pagination--button-next"><span aria-hidden="true">&raquo;</span></a>
                                        </li>
                                    `
                                }
                                outputData += `
                                        </div>
                                    </nav>
                                `
                                //adding page indicator: hidden
                                outputData += `
                                    <div class="p-2 d-none notion-databases-pagination-indicator">page ${pageNow} / ${numberOfPages}</div>
                                `
                                //page train button trigger
                                $(document).on("click",'.notion-databases-pagination--page-train-button', function() {
                                    requestInput.pagination.enable = true
                                    requestInput.pagination.startCursor = $(this).attr('data-start-cursor')
                                    requestInput = JSON.stringify(requestInput,null,2)
                                    $('.notion-databases-input--input').val(requestInput)
                                    notionHqQuery(requestInput)
                                })
                                //prev button trigger
                                $(document).on("click",'.notion-databases-pagination--button-previous', function() {
                                    requestInput.pagination.enable = true
                                    requestInput.pagination.startCursor = $(this).attr('data-prev')
                                    requestInput = JSON.stringify(requestInput,null,2)
                                    $('.notion-databases-input--input').val(requestInput)
                                    notionHqQuery(requestInput)
                                })
                                //next button trigger
                                $(document).on("click",'.notion-databases-pagination--button-next', function() {
                                    requestInput.pagination.enable = true
                                    requestInput.pagination.startCursor = $(this).attr('data-next')
                                    requestInput = JSON.stringify(requestInput,null,2)
                                    $('.notion-databases-input--input').val(requestInput)
                                    notionHqQuery(requestInput)
                                })
                                resolve(pageNow)
                            }
                        }
                    )
                    return promise
                }
                paginationProduce(fullList, currentList, pageSize).then(
                    function(pageNow) {
                        //focus on pageNow
                        $('.notion-databases-pagination--page-train-button[data-index="'+(pageNow-1)+'"]').addClass('active')
                    }
                )
                //page load button on each entry
                $(document).on('click','.page-load-button',function() {
                    var requestInput = {
                        function: 'pagesQuery',
                        data: {
                            pageId: $(this).attr('data-id')
                        },
                        output: {
                            element: $('.notion-pages-input--output-element').val(),
                            console: {
                                enable: $('.notion-pages-input--console-enable').is(':checked'),
                                element: '.notion-hq-output--formatted'//not planned to change
                            }
                        }
                    }
                    requestInput = JSON.stringify(requestInput,null,2)
                    notionHqQuery(requestInput)
                    $('javascript:void(0);page-id').val($(this).attr('data-id'))
                })
                $('.notion-hq-breadcrumbs .col').html('root/database/')
            }//databasesQuery end
            //pagesQuery
            if(responseOutput.function == 'pagesQuery'){
                var responseRawData = responseOutput.data.responseRawData
                var results = responseRawData[1].results//the array of page's block children with details
                var data = ''//create an empty var to extract and make an array of only necessary aspects of the child and then make it visualizable
                for(let i = 0; i < results.length; i++){
                    var type = responseRawData[1].results[i].type
                    if(type == 'paragraph') {
                        var txtLength = results[i].paragraph.rich_text.length
                        if(txtLength!=0) {
                            data +=  results[i].paragraph.rich_text[0].plain_text+'<br/>'
                        }else {
                            data +=  '<br/>'//for blank spaces
                        }
                    }
                    if(type == 'image') {
                        data += `
                            <img class="page-img p-1 border border-primary rounded my-2" style="--bs-border-opacity: .2;" src="${results[i].image.file.url}"/><br/>
                        `
                    }
                }
                var outputDataChildren = data
                var outputData = `
                    <div class="page">
                        <div class="page-header">
                            <div class="page-header--breadcrumb mb-3">
                                <pre>${responseRawData[0].id}</pre>
                            </div>
                            <div class="page-header--details mb-3">
                                <div class="h4 mb-3">
                                    ${responseRawData[0].icon.emoji}   ${responseRawData[0].properties.Name.title[0].plain_text}
                                </div>
                                <div class="mb-3 h5">
                                    ${responseRawData[0].created_time} | 
                                    <img src="${responseRawData[0].properties.Author.people[0].avatar_url}" style="width:20px" alt="Author image" class="rounded-circle"/>&nbsp;&nbsp;${responseRawData[0].properties.Author.people[0].name} | 
                                    <span class="badge bg-primary">${responseRawData[0].properties.Category.select.name}</span>
                                </div>
                            </div>
                        </div>
                        <div class="page-body">
                            ${outputDataChildren}
                        </div>    
                    </div>
                `
                $('.notion-hq-breadcrumbs .col').html('root/database/'+responseRawData[0].id)
            }//pagesQuery end
            //outputing the data
            $(responseOutput.output.element).html(outputData)
            //on page console
            if(responseOutput.output.console.enable) {
                var formatterConfig = {
                    hoverPreviewEnabled: false,
                    hoverPreviewArrayCount: 100,
                    hoverPreviewFieldCount: 5,
                    theme: 'dark',
                    animateOpen: true,
                    animateClose: true,
                    useToJSON: true
                }
                //result.responseText = "truncated"
                //console.log([{xhr}, {status}, {result}])
                //const formatter = new JSONFormatter([{xhr}, {status}, {result}],3,formatterConfig);
                const formatter = new JSONFormatter({xhr},3,formatterConfig);
                $(responseOutput.output.console.element).html(formatter.render()).show()
            }
        }
    ).catch(
        function(err) {
            // Handle error
            console.error(err);
        }
    )
}
