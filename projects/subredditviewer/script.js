// Get some random images, then create an img element for each and append it to the div.
// The images should be styled so they take up all the space and adapt nicely, like at waifu.im

// the target container of the images
let galleryDiv = document.getElementsByClassName('grid')[document.getElementsByClassName('grid').length-1];
let after;

// In case of url parameters, look those up
const url = new URL(window.location.href); 
const paramSub = url.searchParams.get('sub');
const paramTime = url.searchParams.get('time');
if (paramTime !== null) document.getElementById('timeframe').value = paramTime;
if (paramSub !== null) {
    document.getElementById('subredditinput').value = paramSub;
    subSearch(paramSub);
}

// set layout options
var msnry = new Masonry( '.grid', {
    itemSelector: ".grid-item", 
    percentPosition: true, 
    gutter: 0, 
    transitionDuration: 0,
    initLayout: true,
    //horizontalOrder: true,
    gutter: 0
});

function searchByEnter(event, subreddit){
    if(event.keyCode === 13) {
        subSearch(subreddit);
    }
}

async function subSearch(subreddit){

    if (!subreddit){
        return console.log('No subreddit entered.')
    }
    
    console.log('Getting images for new subreddit ' + subreddit);
    
    // remove old posts to make room for new subreddit
    galleryDiv.innerHTML = '';
    
    //subreddit stats
    let sampleImage;
    try{
        sampleImage = (await axios.get(`https://api.reddit.com/r/${subreddit}/top/.json?limit=1&t=all`)).data.data.children;
    } catch(err){
        if (err.message.includes('Network')){
            galleryDiv.innerHTML = '<br>'+err.message+'<br><br>If you are using Firefox, try turning off "Enhanced Tracking Protection" (Lock icon, left of URL)';
        }
        else{
            galleryDiv.innerHTML = '<br>'+err.message;
        }
        return console.log(err.message, err);
    }
    let nameElm = document.getElementById('statname');
    let subsElm = document.getElementById('statsubscribers');
    nameElm.innerHTML = sampleImage[0].data.subreddit_name_prefixed;
    subsElm.innerHTML = sampleImage[0].data.subreddit_subscribers;
    
    // get and add images
    galleryDiv.innerHTML = '';
    after = '';
    msnry.reloadItems();
    let timeframe = document.getElementById('timeframe').value;

    window.history.pushState( {} , '', `?sub=${subreddit}&time=${timeframe}` );

    getPosts(subreddit,timeframe);
}

async function getPosts(subreddit,timeframe) {  
    console.log('The "after" variable is: '+after);

    // fetch images
    let apiRes;
    try{
        apiRes = (await axios.get(`https://api.reddit.com/r/${subreddit}/top/.json?limit=30&t=${timeframe}&after=${after}`)).data.data;
    } catch(err){
        galleryDiv.innerHTML = '<br>'+err.message;
        return console.log(err.message, err)
    }
    let images = apiRes.children;

    after = apiRes.after;
    
    // for-loop to add the img elms
    for (let i=0; i<images.length; i++){
        // get img url
        let imageUrl = images[i].data.url;
        
        // check if url is img
        //  |-what it can include------------------------------------------------------------------------------------------------|
        if (imageUrl.includes('.jpg') || imageUrl.includes('.png') || imageUrl.includes('.gif') || imageUrl.includes('.gifv')) {
            
            // special case for imgur gifs:
            // -> Don't show if nsfw
            if ( ! ( 'nsfw' in images[i].data.preview.images[0].variants && (imageUrl.includes('imgur')) )) {

                // create container
                let imgDiv = document.createElement('div');
                imgDiv.classList.add('grid-item');

                // create the img element
                let imageElm = document.createElement('img');
                imageElm.src = imageUrl;
                imageElm.classList.add('img');
                imageElm.id = 'img '+i;

                // add img to the dom
                imgDiv.appendChild(imageElm);
                galleryDiv.appendChild(imgDiv);
                await msnry.appended(imgDiv);

                // update layout
                await msnry.layout();
            }

        }
        if ( i === images.length-1){
            let loadmoreTrigger = document.createElement('div');
            loadmoreTrigger.id = 'loader-trigger';
            loadmoreTrigger.classList.add('grid-item');
            galleryDiv.appendChild(loadmoreTrigger);
            await msnry.appended(loadmoreTrigger);
            setTimeout(function() { startObserving(loadmoreTrigger.id); }, 300);
        }
    }
    // in case of no images for subreddit
    if (galleryDiv.innerHTML === ''){
        galleryDiv.classList.remove('gallery-big')
        galleryDiv.classList.add('gallery-small')
        galleryDiv.innerHTML = '<br>Error: No images found for this Subreddit';
    }
    await msnry.layout();
    console.log('Loaded all images.')
    setTimeout(function() { refreshGrid(); }, 200);
    //setTimeout(function() { refreshGrid(); }, 500);
};

function refreshGrid(){
    msnry.layout();
    console.log('refreshed grid.');
}

function startObserving(targetId){
    // define an observer instance
    var observer = new IntersectionObserver(onIntersection, {
        root: null,   // default is the viewport
        threshold: .5 // percentage of target's visible area. Triggers "onIntersection"
    })
    
    // callback is called on intersection change
    function onIntersection(entries, opts){
        entries.forEach(entry => (function (){
            if (entry.isIntersecting){
                console.log(`Loading new images...`);
                stopObserving(entry.target.id, observer);
                setTimeout(function() { getPosts(document.getElementById('subredditinput').value,document.getElementById('timeframe').value); }, 500);
            }
        })()
        )
    }
    
    // Use the observer to observe an element
    observer.observe( document.querySelector(`#${targetId}`) )
    
}

function stopObserving(targetId, observer){
    let trigger = document.getElementById(targetId);
    observer.unobserve( trigger );
    msnry.remove( trigger );
    console.log('removed observer');
    msnry.layout();
}

function checkWindowSize(){
    if (document.documentElement.clientWidth <= 700){
        console.log(document.documentElement.clientWidth)
        refreshGrid();
        setTimeout(function() { refreshGrid(); }, 200);
    }
}
window.addEventListener("resize", checkWindowSize);
