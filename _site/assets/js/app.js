(function(global, local) {
    // Storage :
    // -- minimal js lib for manipulating localstorage when building todo list.
    // Built by : @gwuah
    console.log("Hello World");

    function Storage(name) {
        return new Storage.init(name)
    }

    Storage.init = function(name){
        this.name = name;
        this.storage = global.localStorage;
        //this.db is the current handle to the database
        if (this.storage[this.name]) {
            this.db = JSON.parse(this.storage.getItem(this.name))
        } else {
            this.storage.setItem(this.name, JSON.stringify({ tasks: [], taskCount: 0 }))
            this.db = JSON.parse(this.storage.getItem(this.name))
        }   
    }

    Storage.prototype.add = function(value) {
        this.db.tasks.push(value);
        this.update()
    };

    Storage.prototype.update = function() {
        this.storage.setItem(this.name, JSON.stringify(this.db))
    }

    Storage.prototype.find = function(id) {
        return this.db.tasks.find(task => task.id === parseFloat(id))
    }

    Storage.prototype.in = function(name) {
        return this.db.tasks.some(task => task.name === name)

    }

    Storage.prototype.edit = function(id, newName) {
        const task = this.db.tasks.find(task => task.id === parseFloat(id));
        task.name = newName;
        this.update()
    }

    Storage.prototype.updateStatus = function(id, status) {
        const task = this.db.tasks.find(task => task.id === parseFloat(id));
        task.status = status;
        this.update()
    }

    Storage.prototype.findIndex = function(id) {
        return this.db.tasks.findIndex(task => task.id === parseFloat(id));
    }

    Storage.prototype.delete = function(id) {
        const junkIndex = this.findIndex(parseFloat(id));
        this.db.tasks.splice(junkIndex,1);
        // update database so that lib doesn't display deleted tasks on page reload
        this.update();
    }


    Storage.init.prototype = Storage.prototype;

    global.storage = global.d$ = Storage ;

})(window, document)



//--------------------------------------------------------------------------------------------------------//

{
    // logic behind the weather widget
    // Vanilla js

    const city = "Accra";
    const cc = "GH";
    const apiKey = "47e56bfa54af2ce40614c00d4ca9c533";
    let weatherData = null;
    let url = `http://api.openweathermap.org/data/2.5/weather?q=${city},{"RU"}&units=imperial&appid=${apiKey}`;

    const weatherMan = function(weatherData) {
        //convert to degree
        const deg = Math.floor((5/9 * (weatherData.main.temp -32)));
        const degree = $("#degree").text(deg);
        const weather = $("#weather").text(weatherData.weather[0].description);
        const windSpeed = $("#windSpeed").text(weatherData.wind.speed);

        window.weatherData = weatherData;

        if (/cloud/i.test(weatherData.weather[0].main)) {
            $("#weather-image").attr("src", `./assets/img/cloudly.png`)
        } else if (/sun/i.test(weatherData.weather[0].main)) {
            $("#weather-image").attr("src", `./assets/img/sunny.png`)
        } else if (/rain/i.test(weatherData.weather[0].main)) {
            $("#weather-image").attr("src", `./assets/img/rainy.png`)
        }
    }
    
    fetch(url)
    .then(res => res.json())
    .then(json => {
        weatherData = json;
        weatherMan(weatherData)
    })
    .catch(err=> {
        console.log(err)
    }) 
} // contain the snippet so as to prevent variable collission

//--------------------------------------------------------------------------------------------------------//



(function(global, local){

    // Built by : Griffith Awuah
    // Version  : 0.0.1
    // <--- Main Application --->

    /* necessary variable declarations */
    const appName = "dashboard";
    const db = global.storage(appName);
    let taskCount = (db.name == appName ? db["db"].taskCount : 0);
    let hasFocus = false;
    let searchBtn = false;
    let ENTER_KEY = 13;

    /* helper functions */

    const bindEvents = function(task) {
        /* bind various event listeners to task components */
        $(task).find('button[class="delete"]').click(function(){
            // I inserted an icon element in the button. so when you click on the icon, the event is propagated
            // to the button so this callback runs, but event.target willl now be equal to icon instead of button
            // so event.target.parent will now be equal to button.. think!
            // my frontend was breaking my backend so i had to use this trick to evade a nasty problem
            
            deleteTask($(this));
        })

        $(task).find('input[type="checkbox"]').change(e=> {
            reposition($(e.target));
        })

        // hide these 2 elements
        $(task).find('button[class="saveChanges"]').hide()
        $(task).find('input[class="editBox"]').hide()

        // onclick on edit btn, show the editbox and save button
        $(task).find('button[class="edit"]').focus( e => {
            console.log(e.target)
            editFunc(e.target);
        })

        // onclick on save btn, hide the editbox and save button
        $(task).find('button[clPass="saveChanges"]').click( function() {
            saveFunc($(this))
        });
    }

    const restoreData = function() {
        // restore stored data after page reload
        const tasks = db["db"].tasks ;
        if (tasks.length > 0) {
            for (const task of tasks) {
                const oldTask = $("<li></li>").addClass("task").attr("data-id", task.id).html(task.markup);
                bindEvents(oldTask)
                if (task.status == "completed") {
                    $("#completed-Tasks").append(oldTask)
                } else {
                    $("#incomplete-Tasks").append(oldTask)
                }
            }
        } else {
            return 0
        }
    }

    restoreData();

    // Clock

    const parseDateTime = function() {
        const dt = /(\w{3}) (\w{3}) (\d{2}) (\d{4}) (\d{2}):(\d{2})/.exec((new Date()));
        return { day: dt[1], month: dt[2], date: dt[3], year: dt[4], hour: dt[5], minute: dt[6] }
    }

    const updateTime = function() {
        const data = parseDateTime();
        $("#hour").text(data.hour)
        $("#mins").text(data.minute)
        $("#range").text(/\w{2}$/.exec((new Date()).toLocaleTimeString())[0])
        $("#day").text(data.day)
        $("#date").text(data.date)
        $("#year").text(data.year)
        $("#month").text(data.month)
    }

    setInterval(function() {
        updateTime();
    }, 1000)
    
    updateTime()

    const extSearch = function() {
        const payload = encodeURIComponent($("#searchBox").val());
        console.log(payload)
        window.location.href = `https://www.google.com/search?q=${payload}`;
        
    }

    const addTask = function() {
        const taskName = $("#todo-entry").val();
        const dt = parseDateTime();

        if (taskName == "") {
            console.log("cannot add empty task")
            return 0
        } //prevent empty task from being added

        if (db.in(taskName)) {
            console.log("task with the same name already exists");
            return 0
        } // prevent task with the name of a previous task from being added again

        // if immortal is checked, make sure that particular task persists and cannot be deleted
        $("#immortal").is(":checked") ? createTask(taskName, dt, true) : createTask(taskName, dt, false)

        // empty input box after you extract taskName
        $("#todo-entry").val("");
        $('#immortal:checkbox:checked').prop('checked', false);
    }

    const increaseTaskCount = function() {
        taskCount += 1;
        db["db"].taskCount = taskCount;
        db.update()
    }

    const decreaseTaskCount = function() {
        taskCount -= 1;
        db["db"].taskCount = taskCount;
        db.update()
    }

    const markComplete = function(parent) {
        $("#completed-Tasks").append(parent);
        db.updateStatus(parent.attr("data-id"), "completed");
        // console.log(parent.attr("data-id"), "has been marked as complete")
    } // mark as complete

     const markIncomplete = function(parent) {
        $("#incomplete-Tasks").append(parent);
        db.updateStatus(parent.attr("data-id"), "incomplete");
        // console.log(parent.attr("data-id"), "has been marked as incomplete");
    } //mark as incomplete

    const reposition = function(task) {
        const parent = $(task).parent();
        const parentObject = db.find(parent.attr("data-id"));
        if (parentObject.immortal){
            return false
        } else {
            // if trigger is true, mark as completed and mark as incomplete
            $(task).is(":checked") ? markComplete(parent) : markIncomplete(parent);
        }
    }

    const editFunc = function(task) {
        const parent = $(task).parent();
        parent.find('label[for="taskName"]').hide();
        parent.find('input[class="editBox"]').val(parent.find('label[for="taskName"]').text()).show();
        parent.find('button[class="saveChanges"]').show();
    }

    const saveFunc = function(task) {
        const parent = $(task).parent();
        parent.find('label[for="taskName"]').text(parent.find('input[class="editBox"]').val()).show();
        // change the name in the local database too
        db.edit(parent.attr("data-id"), parent.find('label[for="taskName"]').text())
        parent.find('input[class="editBox"]').hide();
        parent.find('button[class="saveChanges"]').hide();
    }

    const deleteTask = function(junkTask) {
        const junk = junkTask.parent()
        const junkObject = db.find(junk.attr("data-id"));
        if (junkObject.immortal){
            // you cant kill an immortal object
        } else {
            junk.remove();
            database.delete(junk.attr("data-id"));
        }
    }

    const createTask = function(name, dt, immortal) {
        let task = document.createElement("li");
        task.className = "task";
        let markup = `<input id="immortality" type="checkbox">
        <label for="taskName">${name}</label><input type="text" class="editBox"> @
        <span>${dt.day} ${dt.month} ${dt.date}, ${dt.year}</span>
        <button class="edit"><i class="ion ion-edit"></i></button>
        <button class="saveChanges">Save <i class="ion ion-thumbsup"></i></button>
        <button class="delete"><i class="fa fa-trash-o"></i></button>`;
        $(task).attr("data-id", taskCount);
        $(task).html(markup);


        db.add({
            id: taskCount,
            name: name,
            immortal: immortal,
            dateTime: dt,
            status: "incomplete",
            markup: $(task).html()
        }); // add the task into the database

        increaseTaskCount()

        bindEvents(task);

        // after all necessary events have been binded, add task to the markup
        $("#incomplete-Tasks").append(task);

    }


    /* minor event listeners */

    $("#todo-entry").focus(e=> {
        // controls how the enter key works
        // need serious refactoring
        hasFocus = true
    })

    $("#todo-entry").blur(e=> {
        // controls how the enter key works
        // need serious refactoring
        hasFocus = false
    })

    $("#searchBox").focus(e=> {
        // controls how the enter key works
        // need serious refactoring
        searchBtn = true
        console.log("has focus")
    })

    $("#searchBox").blur(e=> {
        // controls how the enter key works
        // need serious refactoring
        searchBtn = false
        console.log("has not focus")
    })

    $("#add-task").click((e)=> {
        addTask()
    })

    $(local).keypress((e)=> {
        // create a new task when user presses enter
        if ((e.keyCode == ENTER_KEY) && hasFocus){
            addTask()
        } else if ((e.keyCode == ENTER_KEY) && searchBtn) {
            extSearch()
        }
    })

    $("#search-btn").click(e=> {
        extSearch()
    })



    /* exports */
    global.database = db;
    global.taskCount = taskCount;
    global.parseDateTime = parseDateTime;
    global.restore = restoreData;

})(window, document)


