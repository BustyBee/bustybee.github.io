async function search(query){
    let data = {}
    try{
        data = (await axios.get(`https://totk-compendium.cyclic.app/entry/${query}`)).data
    }
    catch(err){
        return console.error(err.message)
    }

    if (data === ''){
        return console.error('not found')
    }

    console.log(data)

    document.getElementById('name').innerHTML = data.name
    document.getElementById('description').innerHTML = data.description
    document.getElementById('image').src = data.image
    document.getElementById('content').style.display = "flex"
}

function searchByEnter(event, query){
    if(event.keyCode === 13) {
        search(query);
    }
}