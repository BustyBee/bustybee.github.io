let subsafters = [];
let galleryDiv = document.getElementsByClassName('grid')[document.getElementsByClassName('grid').length-1];

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

async function search(input,time){
    // convert input
    const subs = input.replace(/\s/g, "").split(',');

    // log seach query
    console.log(subs,time)
    galleryDiv.innerHTML = 'Loading... This can take a couple of seconds';
    subsafters = [];
    msnry.reloadItems();
    getPosts(subs, time)
}

async function getPosts(subs,time){
    
    let urls = [];

    for (n in subs){
        let urlBatch = []
        while (urlBatch.length <= 20){
            let apiRes;
            try{
                apiRes = (await axios.get(`https://api.reddit.com/r/${subs[n]}/top/.json?limit=30&t=${time}&after=${subsafters[n]}`)).data.data;
            } catch(err){
                return console.log(err.message, err);                
            }
            subsafters[n] = apiRes.after
            let images = apiRes.children;
            for (let i=0; i<images.length; i++){
                let imageUrl = images[i].data.url;
                if (imageUrl.includes('.jpg') || imageUrl.includes('.png') || imageUrl.includes('.gif') || imageUrl.includes('.gifv')) {
                    if (! ('nsfw' in images[i].data.preview.images[0].variants && (imageUrl.includes('imgur')) )){
                        urlBatch.push(imageUrl)
                    }
                }
            }
            console.log(urlBatch.length, 'total images for', subs[n])
            document.getElementById('searchbutton').innerHTML = `${Math.round(((urls.length+urlBatch.length)/(subs.length*23))*100)}%`
        }
        for (let j=0; j<urlBatch.length; j++){
            urls.push(urlBatch[j])
        }
    }
    document.getElementById('searchbutton').innerHTML = 'Search'

    // DISPLAY POSTS
    shuffle(urls)
    for (n in urls){
        // create container
        let imgDiv = document.createElement('div');
        imgDiv.classList.add('grid-item');

        // create the img element
        let imageElm = document.createElement('img');
        imageElm.src = urls[n];
        imageElm.classList.add('img');
        imageElm.id = 'img '+n;

        // add img to the dom
        imgDiv.appendChild(imageElm);
        galleryDiv.appendChild(imgDiv);
        await msnry.appended(imgDiv);

        if ( n == Math.round(urls.length/3)){
            let loadmoreTrigger = document.createElement('div');
            loadmoreTrigger.id = 'loader-trigger';
            loadmoreTrigger.classList.add('grid-item');
            galleryDiv.appendChild(loadmoreTrigger);
            await msnry.appended(loadmoreTrigger);
            setTimeout(function() { startObserving(loadmoreTrigger.id); }, 300);
            console.log('ADDED TRIGGER')
        }

    }
    msnry.layout();
    setTimeout(function() { msnry.reloadItems(); }, 200);
    setTimeout(function() { msnry.layout(); }, 1000);
}




function searchByEnter(event, subreddit){
    if(event.keyCode === 13) {
        search(subreddit, document.getElementById('timeframe').value);
    }
}



function shuffle(array) {
    let currentIndex = array.length,  randomIndex;
    while (currentIndex > 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
    return array;
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
                setTimeout(function() { getPosts(document.getElementById('subredditsinput').value.replace(/\s/g, "").split(','),document.getElementById('timeframe').value); }, 500);
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
        msnry.layout();
        setTimeout(function() { msnry.layout; }, 200);
    }
}
window.addEventListener("resize", checkWindowSize);