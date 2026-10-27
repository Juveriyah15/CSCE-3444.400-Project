// BACKEND FOR LOGIN , VERIFICATION , CREATING GROUPS , LEAVING GROUPS , ADMIN ROLE

const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const app = express();
app.use(express.json());
const users = [];
const groups = [];
const announcements = [];
const notifications = [];
let nextAnnouncementId = 1;
let nextNotificationId = 1;

app.get('/users', (req, res) => {
res.json(users.map(user => ({
email: user.email,
verified: user.verified
})));
});
    

app.post('/users', async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    if (!email || !password) {
    return res.status(400).send('Email or password missing');
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).send('Only strings accepted');
    }

    if (password.length < 10) {
    return res.status(400).send('Password must be at least 10 characters');
    }

    const emailmatch = /^[^\s@]+@(my\.)?unt\.edu$/i;

    if (!emailmatch.test(email)) {
    return res.status(400).send('Only UNT email allowed');
    }

    const previousUser = users.find(
    user => user.email.toLowerCase() === email.toLowerCase()
    );

    if (previousUser) {
    return res.status(409).send('User already exists');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const verificationcode = crypto.randomInt(10000, 100000).toString();

    const user = {
    email: email,
    password: hashedPassword,
    verified: false,
    verificationcode: verificationcode
    };

    users.push(user);

    console.log(' Your verification code is', verificationcode);

    res.status(201).send('Please enter the veriifcation code');

  } catch (error) {
    res.status(500).send('Registration failed');
  }
});


app.post('/users/verify', (req, res) => {
  const email = req.body.email;
  const code = req.body.code;
  if (
  typeof code !== 'string' && typeof code !== 'number'
  ){
  return res.status(400).send('Invalid verification code');
  }

  const enteredCode = String(code);

  if (typeof email !== 'string' || email.trim() === '') {
  return res.status(400).send('Email and code are required');
  }

  const user = users.find(user => user.email.toLowerCase() === email.toLowerCase()
  );

  if (!user) {
  return res.status(404).send('User not found');
  }

  if (user.verified) {
  return res.status(400).send('Account already verified');
  }

  if (user.verificationcode !== enteredCode) {
  return res.status(400).send('Incorrect verification code');
  }

  user.verified = true;
  user.verificationcode = null;

  res.send('Email verified successfully');
});


app.post('/users/login', async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    if (!email || !password) {
    return res.status(400).send('Email and password required');
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).send('Invalid email or password');
    }

    const user = users.find(user => user.email.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
    return res.status(401).send('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(password,user.password);

    if (!passwordMatches) {
    return res.status(401).send('Invalid credentials');
    }

    if (!user.verified) {
    return res.status(403).send('Please try the verification code again');
    }

    res.send('Login successful');

  } catch (error) {
    res.status(500).send('Login failed');
  }
});


let nextGroupId = 1;
app.post('/groups', (req, res) => {
  const name = req.body.name;
  const description = req.body.description;
  const courseCode = req.body.courseCode;
  const hobby = req.body.hobby;
  let maxMembers = req.body.maxMembers;
  if (maxMembers == null) {
  maxMembers = 30;}
  const adminemail = req.body.adminemail;

  if (!name || !description || !adminemail) {
  return res.status(400).send('Some fields are missing');
  }

  if (!courseCode && !hobby) {
  return res.status(400).send('Enter either course code or hobby');
  }

  if (courseCode && hobby) {
  return res.status(400).send('You cannot chose both at same time');
  }

  if (!Number.isInteger(maxMembers) ||maxMembers < 1 || maxMembers > 50) {
  return res.status(400).send('Member minumum = 1 and maximum = 50');
  }
  const emailmatch = /^[^\s@]+@(my\.)?unt\.edu$/i;

  if (!emailmatch.test(adminemail)) {
  return res.status(400).send('Admin must have a UNT email');
  }

  const admin = users.find(
  user => user.email.toLowerCase() === adminemail.toLowerCase()
  );

  if (!admin || !admin.verified) {
  return res.status(403).send('Verified account required');
  }

  const group = {
  id: nextGroupId++,
  name,
  description,
  courseCode: courseCode || null,
  hobby: hobby || null,
  maxMembers,
  adminEmail: admin.email,
  members: [admin.email]
  };

  groups.push(group);

  res.status(201).json({
  message: 'GROUP CREATED',
  group: group
  });
});

app.get('/groups', (req, res) => {
  res.json(groups);
});


app.get('/groups/search', (req, res) => {
  const search = req.query.search;

  if (!search || typeof search !== 'string') {
  return res.status(400).send('Search term required');
  }

  if (search.trim() === '') {
  return res.status(400).send('Search cannot be empty');
  }

  let results = [];
  let searchText = search.toLowerCase();

  for (let i = 0; i < groups.length; i++) {
  let group = groups[i];
  let found = false;
  if (group.name.toLowerCase().includes(searchText)) {
  found = true;
  }

  if (group.courseCode) {
  if (group.courseCode.toLowerCase().includes(searchText)) {
  found = true;
  }
  }

  if (group.hobby) {
  if (group.hobby.toLowerCase().includes(searchText)) {
  found = true;
  }
  }

  
  if (found === true) {
  results.push(group);
  }}

  res.json(results);
});

app.get('/users/:email/groups', (req, res) => {
  const email = req.params.email;

  const user = users.find(
  user => user.email.toLowerCase() === email.toLowerCase()
  );

  if (!user || !user.verified) {
  return res.status(404).send('Verified user not found');
  }

  const joinedGroups = groups.filter(group =>
  group.members.includes(user.email)
  );

  res.json(joinedGroups);
});

app.get('/groups/:id/members', (req, res) => {
  const groupId = parseInt(req.params.id);

  const group = groups.find(group => group.id === groupId);

  if (!group) {
  return res.status(404).send('Group not found');
  }

  res.json({
  groupName: group.name,
  admin: group.adminEmail,
  members: group.members,
  totalMembers: group.members.length
  });
});


app.post('/groups/:id/join', (req, res) => {
  const groupId = parseInt(req.params.id);
  const group = groups.find(group => group.id === groupId);
  const email = req.body.email;

  if (!group) {
  return res.status(404).send('Group not found');
  }
  const emailmatch = /^[^\s@]+@(my\.)?unt\.edu$/i;

  if (!emailmatch.test(email)) {
  return res.status(400).send('UNT EMAIL required');
  }

  const user = users.find(
  user => user.email.toLowerCase() === email.toLowerCase()
  );

  if (!user || !user.verified) {
  return res.status(403).send('Verified account required');
  }

  if (group.members.includes(user.email)) {
  return res.status(409).send('Already a member');
  }

  if (group.members.length >= group.maxMembers) {
  return res.status(409).send('Group is full');
  }

  group.members.push(user.email);

  res.send('Joined group successfully');
  
});




app.post('/groups/:id/leave', (req, res) => {
  const groupId = parseInt(req.params.id);
  const email = req.body.email;
  const nextadminemail = req.body.nextadminemail;

  
  let group = null;
  for (let i = 0; i < groups.length; i++) {
  if (groups[i].id == groupId) {
  group = groups[i];
  break;
  }
  }
  if (group === null) {
  return res.status(404).send('Group not found');
  }
  if (typeof email != 'string') {
    return res.status(400).send('Email required');
  }

  
  let memberIndex = -1;
  for (let i = 0; i < group.members.length; i++) {
  if (group.members[i].toLowerCase() == email.toLowerCase()) {
  memberIndex = i;
  break;
  }
  }

  if (memberIndex == -1) {
  return res.status(400).send('Not a group member');
  }

  
  let isAdmin = false;
  if (group.adminEmail.toLowerCase() == email.toLowerCase()) {
    isAdmin = true;
  }

  
  if (isAdmin && group.members.length > 1) {
  if (nextadminemail) {
  if (typeof nextadminemail != 'string') {
  return res.status(400).send('Invalid next owner');
  }

  let selectedMember = null;
  for (let i = 0; i < group.members.length; i++) {
  if (group.members[i].toLowerCase() == nextadminemail.toLowerCase()) {
  selectedMember = group.members[i];
  break;
  }
  }

  if (selectedMember == null ||
  selectedMember.toLowerCase() == email.toLowerCase()) {
  return res.status(400).send('Choose another group member');
  }

  group.adminEmail = selectedMember;
  } else {
      
  for (let i = 0; i < group.members.length; i++) {
  if (group.members[i].toLowerCase() != email.toLowerCase()) {
  group.adminEmail = group.members[i];
  break;
  }
  }
  }
  }

  
  group.members.splice(memberIndex, 1);

  
  if (group.members.length === 0) {
  groups.splice(groups.indexOf(group), 1);
  return res.send('Group deactivated');
  }

  res.json({
  message: 'Left group successfully',
  newAdmin: group.adminEmail
  });
});

app.delete('/groups/:id', (req, res) => {
  const groupId = parseInt(req.params.id);
  const adminemail = req.body.adminemail;

  const group = groups.find(
  group => group.id === groupId
  );

  if (!group) {
  return res.status(404).send('Group not found');
  }

  if (typeof adminemail !== 'string') {
  return res.status(400).send('Admin email required');
  }

  if (group.adminEmail.toLowerCase() !== adminemail.toLowerCase()) {
  return res.status(403).send('Only group admin can delete');
  }

  const groupIndex = groups.indexOf(group);

  groups.splice(groupIndex, 1);

  res.send('Group deleted successfully');
  });








  



app.get('/users/:email/profile', (req, res) => {
  const email = req.params.email;

  const user = users.find(
  user => user.email.toLowerCase() === email.toLowerCase()
  );

  if (!user || !user.verified) {
  return res.status(404).send('Verified user not found');
  }

  res.json({
  email: user.email,
  name: user.name || '',
  hobbies: user.hobbies || []
  });
});

  
app.put('/users/:email/profile', (req, res) => {
  const email = req.params.email;
  const name = req.body.name;
  const hobbies = req.body.hobbies;

  
  let foundUser = null;
  for (let i = 0; i < users.length; i++) {
  if (users[i].email.toLowerCase() == email.toLowerCase()) {
  foundUser = users[i];
  break;
  }
  }

  
  if (foundUser == null || foundUser.verified == false) {
  return res.status(404).send('Verified user not found');
  }

  
  if (typeof name != 'string' || name.trim() == '') {
  return res.status(400).send('Valid name required');
  }

  
  if (!Array.isArray(hobbies)) {
  return res.status(400).send('Hobbies must in strings');
  }

  for (let i = 0; i < hobbies.length; i++) {
  if (typeof hobbies[i] != 'string') {
  return res.status(400).send('Hobbies must be in strings');
  }
  }

  
  foundUser.name = name.trim();
  foundUser.hobbies = hobbies;

  res.json({
  message: 'Profile updated successfully',
  name: foundUser.name,
  hobbies: foundUser.hobbies
  });
});

app.post('/groups/:id/announcements', (req, res) => {
  const groupId = parseInt(req.params.id);
  const adminemail = req.body.adminemail;
  const message = req.body.message;

  
  let foundGroup = null;
  for (let i = 0; i < groups.length; i++) {
  if (groups[i].id == groupId) {
  foundGroup = groups[i];
  break;
  }
  }

  if (foundGroup == null) {
  return res.status(404).send('Group not found');
  }

  
  if (typeof adminemail != 'string') {
  return res.status(400).send('Admin email required');
  }

  if (foundGroup.adminEmail.toLowerCase() != adminemail.toLowerCase()) {
  return res.status(403).send('Only group admin can post announcements');
  }

  
  if (typeof message != 'string' || message.trim() == '') {
  return res.status(400).send('Announcement message required');
  }

  
  const announcement = {
  id: nextAnnouncementId,
  groupId: foundGroup.id,
  message: message.trim(),
  createdBy: foundGroup.adminEmail,
  createdAt: new Date()
  };

  nextAnnouncementId++;
  announcements.push(announcement);

  res.status(201).json({
  message: 'Announcement successful',
  announcement: announcement
  });
});


app.get('/groups/:id/announcements', (req, res) => {
  const groupId = parseInt(req.params.id);

  const group = groups.find(group => group.id === groupId);

  if (!group) {
  return res.status(404).send('Group not found');
  }

  const results = announcements.filter(announcement => announcement.groupId === groupId
  );

  res.json(results);
});


app.get('/users/:email/notifications', (req, res) => {
  const email = req.params.email;

  const user = users.find(
  user => user.email.toLowerCase() === email.toLowerCase()
  );

  if (!user || !user.verified) {
  return res.status(404).send('Verified user not found');
  }

  const results = notifications.filter(
  notification => notification.email.toLowerCase() === email.toLowerCase()
  );

  res.json(results);
});

app.put('/notifications/:id/read', (req, res) => {
  const id = parseInt(req.params.id);
  const email = req.body.email;

  if (typeof email != 'string') {
  return res.status(400).send('Email required');
  }

  let note = null;
  for (let i = 0; i < notifications.length; i++) {
  if (notifications[i].id == id) {
  note = notifications[i];
  break;
  }
  }

  if (note == null) {
  return res.status(404).send('Notification not found');
  }

  if (note.email.toLowerCase() != email.toLowerCase()) {
  return res.status(403).send('Not your notification');
  }

  note.read = true;

  res.json({
  message: 'Notification was read',
  notification: note
  });
});



app.listen(3005, () => {
console.log('Status RUNNING ON PORT 3005');
});