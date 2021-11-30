let globalUser;
let globalActiveFamily;

/* Authentication */

function signOut() {
    // Firebase auth sign out
    firebase.auth().signOut()
    
        // If sign-out was successful
        .then(() => {
        
            
        // If an error occured
        }).catch((error) => {
        
        
    });
}

function logIn(email, password) {
    
    // Firebase auth sign in
    firebase.auth().signInWithEmailAndPassword(email, password)
    
        // If sign in was successful
        .then((userCredential) => {
        
            // User object (not currently needed for anything)
            /* let user = userCredential.user; */

        })
    
        // If an error occured
        .catch((error) => {
        
            // Error handling from Firebase (not currently needed for anything)
            /* let errorCode = error.code; */
            /* let errorMessage = error.message; */
    });
}

function signUp(displayName, email, password) {
    
    // Firebase auth sign up
    firebase.auth().createUserWithEmailAndPassword(email, password)
    
        // If sign in was successful
        .then((userCredential) => {
        
            const user = firebase.auth().currentUser;

            user.updateProfile({
                displayName: displayName
                
            }).then(() => {
                
                // Update successful
                let location = firebase.database().ref('users/' + globalUser.uid);
                location.update({
                    displayName: displayName,
                });
                
            }).catch((error) => {
                
                // Error handling from Firebase (not currently needed for anything)
                /* let errorCode = error.code; */
                /* let errorMessage = error.message; */
            }); 

        })
    
        // If an error occured
        .catch((error) => {
        
            // Error handling from Firebase (not currently needed for anything)
            /* let errorCode = error.code; */
            /* let errorMessage = error.message; */
    });
}

/* Generate Family Code */

// Recursive function to check if the room code is complete and generate random letters if not
function generateCode(code) {
    
    // If the string isn't yet 4 characters long
    if (code.length < 4) {
        
        // Generate a random number between 0 and 25
        // Convert this new value to an ascii character (uppercase)
        let newLetter = Math.floor(Math.random() * 25);
        newLetter = String.fromCharCode(65 + newLetter);
        
        // Add the new value to the existing room code
        code =  code + newLetter;

        // Run this function again to check if the code is complete now (length of 4)
        generateCode(code);
        
    // If the string is 4 characters
    } else {
        
        // End recursion
        // Passes the 4-digit code into the verifyCode function
        verifyCode(code);
    }
}

// Function to check if the room key passed into it (key) is already an in-session game in the database
function verifyCode(code) {
    
    // Checks that specific location in the database and takes a snapshot
    firebase.database().ref('families/' + code).once("value", snapshot => {

        // If the snapshot exists already
        if (snapshot.exists()) {
            
            // Rerun the code generator and try again
            generateCode('');
            
        // If the snapshot doesn't exist, we can set up the family
        } else {
            $('#create-family-code').val(code);
        }
    });
}

/* Create/Initialize Family & Founding User */

function createFamily(familyName, event, code) {
    let user = firebase.auth().currentUser;
    if (globalUser) {
        let displayName = user.displayName
        let codeValues = {};
        codeValues[code] = {
            displayName: displayName
        };
        let location = firebase.database().ref('users/' + user.uid);
        location.update({
            displayName: displayName,
            activeFamily: code
        }, (error) => {
                if (error) {
                    
                    // Write failed
                    console.log(error);
                } else {
                    
                    // Data saved succcessfully
                    
                    let userFamilyLocation = firebase.database().ref('users/' + user.uid + '/families/' + code);
                    userFamilyLocation.set({
                        displayName: displayName
                    },(error) => {
                        if (error) {
                            
                            // Write failed
                            console.log(error);
                        } else {
                            
                            // Data saved succcessfully
                            
                            let values = {};
                    values[user.uid] = {
                        displayName : displayName
                    };
                    
                    let familyLocation = firebase.database().ref('families/' + code);
                    familyLocation.set({
                        activeEvent: event,
                        familyName: familyName,
                        members: values
                    }, (error) => {
                        if (error) {
                            
                            // Write failed
                            console.log(error);
                        } else {
                            
                            // Data saved succcessfully
                            loadFamiliesList();
                        }
                    })
                        }
                    })
                }
        })
    }
}

/* Load Families on My Families View */
function loadFamiliesList() {
    if (globalUser) {
        let location = firebase.database().ref('users/' + globalUser.uid);
        location.once('value', function(snapshot) {
            $('#loaded-family-list').empty();
            let data = snapshot.val();
            let activeFamily;
            let families = data.families;

            if (families) {
                activeFamily = data.activeFamily;
                for (let family in families) {
                    let familyLocation = firebase.database().ref('families/' + family);
                    familyLocation.once('value', function(snapshot) {
                        let familyInfo = snapshot.val();
                        let familyName = familyInfo.familyName;
                        let extraClass = '';
                        if (family == activeFamily) {
                            extraClass = 'selected';
                        }
                        $('#loaded-family-list').append(`
                            <div class="list-item state-change ${extraClass}" color="faint-blue" destination="family-view" code="${family}">
                                <div class="left">
                                    <i class="material-icons-round">people</i>
                                    <p class="family-name">${familyName}</p>
                                    <p class="family-code">${family}</p>
                                </div>
                                <div class="right">
                                    <i class="material-icons-round">navigate_next</i>
                                </div>
                            </div>
                        `);
                    });
                }
            } else {
                $('#loaded-family-list').append(`
                    <div class="alert info">
                      <i class="material-icons-round">info</i>
                      <p>You have not joined any families yet! Families you join will appear in this list.</p>
                    </div>
                `);
            }
        });
    }
}

/Load Family info on Family View */
function populateFamilyView(code) {
    let location = firebase.database().ref('families/' + code);
    location.once("value", snapshot => {
        if (snapshot.val()) {
            $('#loaded-family-members').empty();
            let familyRecord = snapshot.val();
            let familyName = familyRecord.familyName;
            let activeEvent =  familyRecord.activeEvent;
            let familyCode = code;
            let familyMembers = familyRecord.members;
            
            for (let familyMember in familyMembers) {
                let memberName = familyMembers[familyMember]['displayName']
                $('#loaded-family-members').append(`
                    <div class="list-item" color="white" name="${memberName}">
                        <div class="left">
                            <i class="material-icons-round">person</i>
                            <p class="member-name">${memberName}</p>
                        </div>
                        <div class="right">
                            <i class="material-icons-round">navigate_next</i>
                        </div>
                    </div>
                `);
            }
            $('div[state="family-view"]').find('h1').text(familyName);
            $('div[state="family-view"]').find('h2').text(activeEvent);
        }
    });
}

/* DOM-User Interactions */

// Shows destination state and hides other states
function changeState(destination) {
    
    $('#app').queue(function() {
        
        // Fade out current state(s)
        $('.state').fadeOut(400);

        $.dequeue(this);
    }).delay(400).queue(function() {
        
        // Fade in new (destination) state
        $(`.state[state="${destination}"]`).fadeIn();
        
        // Temporarily making sure our testing state stays as well (TODO: remove)
        $('.state[state="testing"]').fadeIn();
        $.dequeue(this);
    });
}

// If an element with DOM attribute "function" set to "signout" is clicked
$(document).on('click', '#signout', function() {

    // Call function signOut to handle authentication sign out
    signOut();
});


// If an element with DOM attribute "function" set to "login" is clicked
$(document).on('click', '#login', function() {

    // Call function logIn to handle authentication log in
    logIn($('#login-email').val(), $('#login-password').val());
});


// If an element with ID "signup" is clicked
$(document).on('click', '#signup', function() {

    // Call function logIn to handle authentication log in
    signUp($('#signup-display-name').val(), $('#signup-email').val(), $('#signup-password').val());
});

// If an element with ID "create-family" is clicked
// TODO, empty form validation
$(document).on('click', '#create-family', function() {

    let familyName = $('#create-family-name').val();
    let event = $('#create-family-event').val();
    let code = $('#create-family-code').val();
    
    // Call function generateCode to generate code for form
    createFamily(familyName, event, code);
});

$(document).ready(function () {

    // "Router" function for buttons that change the app's UX state
    $('#app').on('click', '.state-change', function(event) {

        // Gets destination from button's "destination" attribute
        let destination = $(this).attr('destination');
        let menuStatus;
        if ($('[state="' + destination + '"]').hasClass('no-menu')) {
            $('#menu').find('.selected').each(function(index) {
                $(this).removeClass('selected');
            });
            $('#menu').fadeOut();
        } else if ($('[state="' + destination + '"]').attr('menu-selected') === 'family') {
            $('#menu').fadeIn();
            $('#menu').find('.selected').each(function(index) {
                $(this).removeClass('selected');
            });
            $('#menu').find('#family-menu').addClass('selected');
        } else if ($('[state="' + destination + '"]').attr('menu-selected') === 'claimed') {
            $('#menu').fadeIn();
            $('#menu').find('.selected').each(function(index) {
                $(this).removeClass('selected');
            });
            $('#menu').find('#claimed-menu').addClass('selected');
        } else if ($('[state="' + destination + '"]').attr('menu-selected') === 'profile') {
            $('#menu').fadeIn();
            $('#menu').find('.selected').each(function(index) {
                $(this).removeClass('selected');
            });
            $('#menu').find('#profile-menu').addClass('selected');
        } else {
            $('#menu').find('.selected').each(function(index) {
                $(this).removeClass('selected');
            });
            $('#menu').fadeIn();
        }
        changeState(destination);
        switch(destination) {
            case "create-family":
                generateCode('');
                break;
            case "my-families":
                loadFamiliesList();
                break;
            case "family-view":
                let code = $(this).attr('code');
                let location = firebase.database().ref('users/' + globalUser.uid);
                location.update({activeFamily: code});
                populateFamilyView(code);
                break;
            default:
                break;
        }
    });
});

// Tracker to handle whether or not a user is currently logged in, updates UI accordingly
firebase.auth().onAuthStateChanged((user) => {
    if (user) {

        // User is signed in
        globalUser = user;
        firebase.database().ref('users/' + globalUser.uid + '/activeFamily').on("value", snapshot => {
            if (snapshot.val()) {
                globalActiveFamily = snapshot.val();
            } else {
                globalActiveFamily = null;
            }
        });

    } else {

        // User is signed out
        globalUser = null;
    }
    loadFamiliesList();
});
