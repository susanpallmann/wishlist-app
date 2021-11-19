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
                console.log(user.displayName);
                
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
    if (user) {
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
                    console.log('success');
                    
                    let userFamilyLocation = firebase.database().ref('users/' + user.uid + '/families/' + code);
                    userFamilyLocation.set({
                        displayName: displayName
                    },(error) => {
                        if (error) {
                            
                            // Write failed
                            console.log(error);
                        } else {
                            
                            // Data saved succcessfully
                            console.log('success2');
                            
                            let values = {};
                    values[user.uid] = {
                        displayName : displayName
                    };
                    
                    let familyLocation = firebase.database().ref('families/' + code);
                    familyLocation.set({
                        familyName: familyName,
                        members: values
                    }, (error) => {
                        if (error) {
                            
                            // Write failed
                            console.log(error);
                        } else {
                            
                            // Data saved succcessfully
                            console.log('success3');
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
    const user = firebase.auth().currentUser;
    let location = firebase.database().ref('users/' + user.uid + '/families/');
    location.once('value', function(snapshot) {
        let families = snapshot.val();
        for (let family in families) {
            console.log(family);
            //let familyLocation = firebase.database().ref('families/' + family);
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

    // Tracker to handle whether or not a user is currently logged in, updates UI accordingly
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            
            // User is signed in
            // User object (not currently needed for anything)
            let uid = user.uid;
            
        } else {
            
            // User is signed out
        }
    });
    
    
    // "Router" function for buttons that change the app's UX state
    $('.state-change').click(function(event) {

        // Gets destination from button's "destination" attribute
        let destination = $(this).attr('destination');
        changeState(destination);
        switch(destination) {
            case "create-family":
                generateCode('');
                break;
            case "my-families":
                loadFamiliesList();
                break;
            default:
                break;
        }
    });
});
