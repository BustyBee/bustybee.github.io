(async() => {
    const articles = await(await fetch('https://raw.githubusercontent.com/BustyBee/TotK-ModdingTutorials/main/all.json')).json()
    let targetul = document.getElementById('articles')
    
    for (let i=1; i<articles.length; i++){
        let newli = document.createElement('li')
        let newa = document.createElement('a')
        newa.innerHTML = articles[i].name
        newa.href = '/projects/totkmoddingtutorials/tutorials/' + articles[i].file
        newli.appendChild(newa)
        targetul.appendChild(newli)
    }
})()