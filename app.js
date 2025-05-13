// DOM Elements
const loginSection = document.getElementById('login-section');
const signupSection = document.getElementById('signup-section');
const homepageSection = document.getElementById('homepage');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const logoutBtn = document.getElementById('logout-btn');
const userProfileDetails = document.getElementById('user-profile-details');
const membersList = document.getElementById('members-list');
const familyNewsList = document.getElementById('family-news-list');
const birthdaysList = document.getElementById('birthdays-list');

// Modal Elements
const addMemberModal = document.getElementById('add-member-modal');
const editProfileModal = document.getElementById('edit-profile-modal');
const addMemberBtn = document.getElementById('add-member-btn');
const editProfileBtn = document.getElementById('edit-profile-btn');
const membersBtn = document.getElementById('members-btn');
const familyNewsBtn = document.getElementById('family-news-btn');
const addNewsBtn = document.getElementById('add-news-btn');
const addNewsModal = document.getElementById('add-news-modal');
const birthdaysBtn = document.getElementById('birthdays-btn');
const birthdaysModal = document.getElementById('birthdays-modal');

// New Edit Members Elements
const editMembersBtn = document.getElementById('edit-members-btn');
const editMembersModal = document.getElementById('edit-members-modal');
const editableMembersList = document.getElementById('editable-members-list');

// Modal Close Buttons
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
        addMemberModal.style.display = 'none';
        editProfileModal.style.display = 'none';
        addNewsModal.style.display = 'none';
        editMembersModal.style.display = 'none';
        birthdaysModal.style.display = 'none';
    });
});

// Toggle between Login and Signup
document.getElementById('show-signup').addEventListener('click', (e) => {
    e.preventDefault();
    loginSection.style.display = 'none';
    signupSection.style.display = 'block';
});

document.getElementById('show-login').addEventListener('click', (e) => {
    e.preventDefault();
    signupSection.style.display = 'none';
    loginSection.style.display = 'block';
});

// Login Handler
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        console.log('Attempting login with email:', email);
        
        // Validate input
        if (!email || !password) {
            throw new Error('Please enter both email and password');
        }

        // Attempt sign in
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        console.log('Login successful for user:', user.uid);
        
        // Hide login section and show main app
        loginSection.style.display = 'none';
        homepageSection.style.display = 'block';
        
        // Load user profile and members
        await loadUserProfile();
        loadFamilyMembers();
    } catch (error) {
        console.error('Login Error:', {
            code: error.code,
            message: error.message
        });

        // Detailed error handling
        let errorMessage = 'An error occurred during login.';
        switch (error.code) {
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address format.';
                break;
            case 'auth/user-disabled':
                errorMessage = 'This user account has been disabled.';
                break;
            case 'auth/user-not-found':
                errorMessage = 'No user found with this email address.';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Incorrect password. Please try again.';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Network error. Please check your internet connection.';
                break;
            default:
                errorMessage = error.message || 'Login failed. Please try again.';
        }

        // Display error to user
        const errorElement = document.createElement('div');
        errorElement.classList.add('login-error');
        errorElement.textContent = errorMessage;
        loginForm.appendChild(errorElement);

        // Remove error after 5 seconds
        setTimeout(() => {
            if (errorElement.parentNode) {
                errorElement.parentNode.removeChild(errorElement);
            }
        }, 5000);
    }
});

// Signup Handler
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const profilePhotoFile = document.getElementById('signup-profile-photo').files[0];

    try {
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Upload profile photo if selected
        let profilePhotoUrl = '';
        if (profilePhotoFile) {
            const storageRef = firebase.storage().ref(`profile_photos/${user.uid}`);
            const uploadTask = await storageRef.put(profilePhotoFile);
            profilePhotoUrl = await uploadTask.ref.getDownloadURL();
        }

        // Store user info with optional profile photo
        await firebase.firestore().collection('users').doc(user.uid).set({
            name: name,
            email: email,
            profilePhotoUrl: profilePhotoUrl || ''
        });
    } catch (error) {
        alert(error.message);
    }
});

// Logout Handler
logoutBtn.addEventListener('click', () => {
    firebase.auth().signOut();
});

// Add Member Handler
document.getElementById('add-member-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentUser = firebase.auth().currentUser;
    const profilePhotoFile = document.getElementById('member-profile-photo').files[0];

    const memberData = {
        name: document.getElementById('member-name').value,
        dob: document.getElementById('member-dob').value,
        contact: document.getElementById('member-contact').value,
        hobbies: document.getElementById('member-hobbies').value,
        instagram: document.getElementById('member-instagram').value,
        description: document.getElementById('member-description').value
    };

    try {
        // Upload profile photo if selected
        let profilePhotoUrl = '';
        if (profilePhotoFile) {
            const storageRef = firebase.storage().ref(`member_photos/${Date.now()}_${profilePhotoFile.name}`);
            const uploadTask = await storageRef.put(profilePhotoFile);
            profilePhotoUrl = await uploadTask.ref.getDownloadURL();
        }

        // Add profile photo URL to member data
        memberData.profilePhotoUrl = profilePhotoUrl;

        await firebase.firestore().collection('family_members').add({
            ...memberData,
            addedBy: currentUser.uid
        });
        addMemberModal.style.display = 'none';
        loadFamilyMembers();
    } catch (error) {
        alert(error.message);
    }
});

// Edit Profile Handler
document.getElementById('edit-profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentUser = firebase.auth().currentUser;

    const profileData = {
        name: document.getElementById('edit-name').value,
        dob: document.getElementById('edit-dob').value,
        contact: document.getElementById('edit-contact').value,
        hobbies: document.getElementById('edit-hobbies').value,
        instagram: document.getElementById('edit-instagram').value,
        description: document.getElementById('edit-description').value
    };

    try {
        await firebase.firestore().collection('users').doc(currentUser.uid).update(profileData);
        editProfileModal.style.display = 'none';
        loadUserProfile();
    } catch (error) {
        alert(error.message);
    }
});

// Load User Profile
async function loadUserProfile() {
    const currentUser = firebase.auth().currentUser;
    
    try {
        const userDoc = await firebase.firestore().collection('users').doc(currentUser.uid).get();
        const userData = userDoc.data();

        userProfileDetails.innerHTML = `
            <div class="user-profile-photo">
                <img src="${userData.profilePhotoUrl || 'path/to/default-profile.png'}" alt="Profile Photo">
            </div>
            <div class="user-profile-info">
                <p><strong>Name:</strong> ${userData.name || 'Not set'}</p>
                ${userData.dob ? `<p><strong>Date of Birth:</strong> ${userData.dob}</p>` : ''}
                ${userData.contact ? `<p><strong>Contact:</strong> ${userData.contact}</p>` : ''}
                ${userData.hobbies ? `<p><strong>Hobbies:</strong> ${userData.hobbies}</p>` : ''}
                ${userData.instagram ? `<p><strong>Instagram:</strong> ${userData.instagram}</p>` : ''}
                ${userData.description ? `<p><strong>About:</strong> ${userData.description}</p>` : ''}
            </div>
        `;

        // Populate edit profile form
        document.getElementById('edit-name').value = userData.name || '';
        document.getElementById('edit-dob').value = userData.dob || '';
        document.getElementById('edit-contact').value = userData.contact || '';
        document.getElementById('edit-hobbies').value = userData.hobbies || '';
        document.getElementById('edit-instagram').value = userData.instagram || '';
        document.getElementById('edit-description').value = userData.description || '';
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
}

// Load Family Members
async function loadFamilyMembers() {
    try {
        const snapshot = await firebase.firestore().collection('family_members').get();
        membersList.innerHTML = '';
        
        snapshot.forEach((doc) => {
            const member = doc.data();
            const memberCard = document.createElement('div');
            memberCard.classList.add('member-card');
            memberCard.innerHTML = `
                <div class="member-profile-photo">
                    <img src="${member.profilePhotoUrl || 'path/to/default-profile.png'}" alt="${member.name}'s profile photo">
                </div>
                <div class="member-details">
                    <h3>${member.name}</h3>
                    <p>Date of Birth: ${member.dob}</p>
                    <p>Contact: ${member.contact}</p>
                    <p>Hobbies: ${member.hobbies}</p>
                    ${member.instagram ? `<p>Instagram: ${member.instagram}</p>` : ''}
                    ${member.description ? `<p>About: ${member.description}</p>` : ''}
                </div>
            `;
            membersList.appendChild(memberCard);
        });
    } catch (error) {
        console.error('Error loading family members:', error);
    }
}

// Load Family News
async function loadFamilyNews() {
    try {
        const snapshot = await firebase.firestore().collection('family_news')
            .orderBy('date', 'desc')
            .get();
        
        // Clear previous content and add Add News button
        familyNewsList.innerHTML = `
            <div class="header">
                <button id="add-news-btn">+ Add News</button>
            </div>
            <div class="news-container">
                ${snapshot.empty ? '<p class="no-news">No family news yet.</p>' : ''}
            </div>
        `;
        
        // Re-attach event listener to the dynamically added button
        document.getElementById('add-news-btn').addEventListener('click', () => {
            addNewsModal.style.display = 'block';
        });
        
        const newsContainer = familyNewsList.querySelector('.news-container');
        
        snapshot.forEach((doc) => {
            const news = doc.data();
            const newsCard = document.createElement('div');
            newsCard.classList.add('news-card');
            newsCard.innerHTML = `
                <div class="news-header">
                    <h3 class="news-topic">${news.topic}</h3>
                    <div class="news-meta">
                        <span class="news-date">${news.date}</span>
                        <span class="news-time">${news.time}</span>
                    </div>
                </div>
                <div class="news-body">
                    <p>${news.body}</p>
                </div>
                <div class="news-actions">
                    <button class="edit-news-btn" data-id="${doc.id}">Edit</button>
                    <button class="delete-news-btn" data-id="${doc.id}">Delete</button>
                </div>
            `;
            newsContainer.appendChild(newsCard);
        });

        // Add event listeners for edit and delete buttons
        newsContainer.querySelectorAll('.edit-news-btn').forEach(btn => {
            btn.addEventListener('click', (e) => editNews(e.target.dataset.id));
        });

        newsContainer.querySelectorAll('.delete-news-btn').forEach(btn => {
            btn.addEventListener('click', (e) => deleteNews(e.target.dataset.id));
        });
    } catch (error) {
        console.error('Error loading family news:', error);
    }
}

// Edit News Function
async function editNews(newsId) {
    try {
        const newsDoc = await firebase.firestore().collection('family_news').doc(newsId).get();
        const news = newsDoc.data();

        // Create edit form dynamically
        const editForm = document.createElement('div');
        editForm.classList.add('edit-news-form');
        editForm.innerHTML = `
            <form id="edit-news-form">
                <input type="text" id="edit-news-topic" value="${news.topic}" placeholder="Topic" required>
                <input type="date" id="edit-news-date" value="${news.date}" placeholder="Date" required>
                <input type="time" id="edit-news-time" value="${news.time}" placeholder="Time" required>
                <textarea id="edit-news-body" placeholder="Main Body of News" required>${news.body}</textarea>
                <div class="form-actions">
                    <button type="submit">Save Changes</button>
                    <button type="button" id="cancel-edit-news">Cancel</button>
                </div>
            </form>
        `;

        // Create a modal-like overlay
        const editOverlay = document.createElement('div');
        editOverlay.classList.add('edit-news-overlay');
        editOverlay.appendChild(editForm);
        document.body.appendChild(editOverlay);

        // Add submit event listener
        const editNewsForm = editOverlay.querySelector('#edit-news-form');
        editNewsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const updatedNewsData = {
                topic: document.getElementById('edit-news-topic').value,
                date: document.getElementById('edit-news-date').value,
                time: document.getElementById('edit-news-time').value,
                body: document.getElementById('edit-news-body').value
            };

            try {
                await firebase.firestore().collection('family_news').doc(newsId).update(updatedNewsData);
                alert('News updated successfully');
                editOverlay.remove();
                loadFamilyNews();
            } catch (error) {
                console.error('Error updating news:', error);
                alert('Failed to update news');
            }
        });

        // Cancel edit
        editOverlay.querySelector('#cancel-edit-news').addEventListener('click', () => {
            editOverlay.remove();
        });
    } catch (error) {
        console.error('Error fetching news details:', error);
    }
}

// Delete News Function
async function deleteNews(newsId) {
    if (confirm('Are you sure you want to delete this news item?')) {
        try {
            await firebase.firestore().collection('family_news').doc(newsId).delete();
            alert('News deleted successfully');
            loadFamilyNews();
        } catch (error) {
            console.error('Error deleting news:', error);
            alert('Failed to delete news');
        }
    }
}

// Add News Handler
document.getElementById('add-news-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentUser = firebase.auth().currentUser;
    
    const newsData = {
        topic: document.getElementById('news-topic').value,
        date: document.getElementById('news-date').value,
        time: document.getElementById('news-time').value,
        body: document.getElementById('news-body').value
    };

    try {
        await firebase.firestore().collection('family_news').add({
            ...newsData,
            addedBy: currentUser.uid
        });
        addNewsModal.style.display = 'none';
        
        // Reload family news if currently visible
        if (familyNewsList.style.display !== 'none') {
            loadFamilyNews();
        }
    } catch (error) {
        alert(error.message);
    }
});

// Event Listeners for Modals and Buttons
addMemberBtn.addEventListener('click', () => {
    addMemberModal.style.display = 'block';
});

editProfileBtn.addEventListener('click', () => {
    editProfileModal.style.display = 'block';
});

editMembersBtn.addEventListener('click', () => {
    editMembersModal.style.display = 'block';
    loadEditableMembers();
});

// Navigation Button Event Listeners
membersBtn.addEventListener('click', () => {
    membersList.style.display = 'block';
    familyNewsList.style.display = 'none';
    birthdaysList.style.display = 'none';
    loadFamilyMembers();
});

birthdaysBtn.addEventListener('click', () => {
    membersList.style.display = 'none';
    familyNewsList.style.display = 'none';
    birthdaysList.style.display = 'block';
    loadBirthdays();
});

familyNewsBtn.addEventListener('click', () => {
    membersList.style.display = 'none';
    familyNewsList.style.display = 'block';
    birthdaysList.style.display = 'none';
    loadFamilyNews();
});

addNewsBtn.addEventListener('click', () => {
    addNewsModal.style.display = 'block';
});

// Remove previous navigation event listeners
document.getElementById('members-nav-btn')?.removeEventListener('click', () => {});
document.getElementById('family-news-nav-btn')?.removeEventListener('click', () => {});
document.getElementById('birthdays-nav-btn')?.removeEventListener('click', () => {});

// Load Editable Members
async function loadEditableMembers() {
    try {
        const snapshot = await firebase.firestore().collection('family_members').get();
        editableMembersList.innerHTML = '';
        
        snapshot.forEach((doc) => {
            const member = doc.data();
            const memberItem = document.createElement('div');
            memberItem.classList.add('editable-member-item');
            memberItem.innerHTML = `
                <div class="member-info">
                    <span class="member-name">${member.name}</span>
                    <span class="member-contact">${member.contact || 'No contact'}</span>
                </div>
                <div class="member-actions">
                    <button class="edit-member-btn" data-id="${doc.id}">Edit</button>
                    <button class="delete-member-btn" data-id="${doc.id}">Delete</button>
                </div>
            `;
            editableMembersList.appendChild(memberItem);
        });

        // Add event listeners for edit and delete buttons
        editableMembersList.querySelectorAll('.edit-member-btn').forEach(btn => {
            btn.addEventListener('click', (e) => editMember(e.target.dataset.id));
        });

        editableMembersList.querySelectorAll('.delete-member-btn').forEach(btn => {
            btn.addEventListener('click', (e) => deleteMember(e.target.dataset.id));
        });
    } catch (error) {
        console.error('Error loading editable members:', error);
    }
}

// Edit Member Function
async function editMember(memberId) {
    try {
        const memberDoc = await firebase.firestore().collection('family_members').doc(memberId).get();
        const member = memberDoc.data();

        // Create edit form dynamically
        const editForm = document.createElement('form');
        editForm.id = 'edit-member-form';
        editForm.innerHTML = `
            <input type="text" id="edit-member-name" value="${member.name}" placeholder="Name" required>
            <input type="date" id="edit-member-dob" value="${member.dob}" placeholder="Date of Birth">
            <input type="tel" id="edit-member-contact" value="${member.contact}" placeholder="Contact Number">
            <input type="text" id="edit-member-hobbies" value="${member.hobbies}" placeholder="Hobbies">
            <input type="text" id="edit-member-instagram" value="${member.instagram}" placeholder="Instagram Handle">
            <textarea id="edit-member-description" placeholder="About the member">${member.description}</textarea>
            <button type="submit">Save Changes</button>
        `;

        // Replace existing content with edit form
        editableMembersList.innerHTML = '';
        editableMembersList.appendChild(editForm);

        // Add submit event listener
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const updatedMemberData = {
                name: document.getElementById('edit-member-name').value,
                dob: document.getElementById('edit-member-dob').value,
                contact: document.getElementById('edit-member-contact').value,
                hobbies: document.getElementById('edit-member-hobbies').value,
                instagram: document.getElementById('edit-member-instagram').value,
                description: document.getElementById('edit-member-description').value
            };

            try {
                await firebase.firestore().collection('family_members').doc(memberId).update(updatedMemberData);
                alert('Member updated successfully');
                editMembersModal.style.display = 'none';
                loadFamilyMembers();
            } catch (error) {
                console.error('Error updating member:', error);
                alert('Failed to update member');
            }
        });
    } catch (error) {
        console.error('Error fetching member details:', error);
    }
}

// Delete Member Function
async function deleteMember(memberId) {
    if (confirm('Are you sure you want to delete this member?')) {
        try {
            await firebase.firestore().collection('family_members').doc(memberId).delete();
            alert('Member deleted successfully');
            loadEditableMembers();
            loadFamilyMembers();
        } catch (error) {
            console.error('Error deleting member:', error);
            alert('Failed to delete member');
        }
    }
}

// Function to calculate days until next birthday
function calculateDaysUntilBirthday(dobString) {
    const today = new Date();
    const dob = new Date(dobString);
    
    // Set the birthday for this year
    let nextBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
    
    // If the birthday has already passed this year, set it to next year
    if (nextBirthday < today) {
        nextBirthday.setFullYear(today.getFullYear() + 1);
    }
    
    // Calculate the difference in days
    const timeDiff = nextBirthday.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return {
        daysRemaining: daysDiff,
        nextBirthday: nextBirthday
    };
}

// Function to format birthday description
function formatBirthdayDescription(dobString) {
    const { daysRemaining, nextBirthday } = calculateDaysUntilBirthday(dobString);
    const dob = new Date(dobString);
    
    if (daysRemaining === 0) {
        return "🎉 Birthday Today! 🎉";
    } else if (daysRemaining === 1) {
        return "🎂 Birthday Tomorrow!";
    } else if (daysRemaining <= 30) {
        return `🎈 ${daysRemaining} days until birthday`;
    } else {
        const months = Math.floor(daysRemaining / 30);
        return `🎈 ${months} month(s) until birthday`;
    }
}

// Load Birthdays
async function loadBirthdays() {
    try {
        const snapshot = await firebase.firestore().collection('family_members').get();
        const birthdaysList = document.getElementById('birthdays-list');
        birthdaysList.innerHTML = ''; // Clear previous content
        
        // Create an array to store members with their birthday info
        const membersWithBirthdays = [];
        
        snapshot.forEach((doc) => {
            const member = doc.data();
            if (member.dob) {
                const birthdayInfo = calculateDaysUntilBirthday(member.dob);
                membersWithBirthdays.push({
                    ...member,
                    daysRemaining: birthdayInfo.daysRemaining,
                    nextBirthday: birthdayInfo.nextBirthday
                });
            }
        });
        
        // Sort members by days remaining
        membersWithBirthdays.sort((a, b) => a.daysRemaining - b.daysRemaining);
        
        // Create birthday cards
        membersWithBirthdays.forEach((member) => {
            const birthdayCard = document.createElement('div');
            birthdayCard.classList.add('birthday-card');
            
            // Calculate age
            const dob = new Date(member.dob);
            const age = new Date().getFullYear() - dob.getFullYear();
            
            birthdayCard.innerHTML = `
                <div class="birthday-card-content">
                    <div class="birthday-photo">
                        <img src="${member.profilePhotoUrl || 'path/to/default-profile.png'}" alt="${member.name}'s photo">
                    </div>
                    <div class="birthday-details">
                        <h3>${member.name}</h3>
                        <p>Date of Birth: ${member.dob}</p>
                        <p>Age: ${age}</p>
                        <p class="birthday-countdown">${formatBirthdayDescription(member.dob)}</p>
                    </div>
                </div>
            `;
            
            birthdaysList.appendChild(birthdayCard);
        });
        
        // If no birthdays found
        if (membersWithBirthdays.length === 0) {
            birthdaysList.innerHTML = '<p class="no-birthdays">No upcoming birthdays found.</p>';
        }
    } catch (error) {
        console.error('Error loading birthdays:', error);
    }
}

// Event Listeners for Birthdays Modal
document.getElementById('birthdays-btn').addEventListener('click', () => {
    const birthdaysModal = document.getElementById('birthdays-modal');
    birthdaysModal.style.display = 'block';
    loadBirthdays();
});

// Close Birthdays Modal
document.querySelectorAll('#birthdays-modal .close-modal').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
        document.getElementById('birthdays-modal').style.display = 'none';
    });
});

// Authentication State Observer
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        loginSection.style.display = 'none';
        signupSection.style.display = 'none';
        homepageSection.style.display = 'block';
        
        loadUserProfile();
        
        // Automatically load and display Members page
        membersList.style.display = 'block';
        familyNewsList.style.display = 'none';
        birthdaysList.style.display = 'none';
        loadFamilyMembers();
    } else {
        loginSection.style.display = 'block';
        signupSection.style.display = 'none';
        homepageSection.style.display = 'none';
    }
});