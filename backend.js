// BACKEND FOR LOGIN , VERIFICATION , CREATING GROUPS , LAEVING GROUPS , ADMIN ROLE

const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const app = express();
app.use(express.json());
const users = [];
const groups = [];


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

  if (typeof email !== 'string' || typeof code !== 'string') {
    return res.status(400).send('Email and code are required');
  }

  const user = users.find(
    user => user.email.toLowerCase() === email.toLowerCase()
  );

  if (!user) {
    return res.status(404).send('User not found');
  }

  if (user.verified) {
    return res.status(400).send('Account already verified');
  }

  if (user.verificationCode !== code) {
    return res.status(400).send('Incorrect verification code');
  }

  user.verified = true;
  user.verificationCode = null;

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

    const user = users.find(
      user => user.email.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      return res.status(401).send('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

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
  const maxMembers = req.body.maxMembers;
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

  const group = groups.find(group => group.id === groupId);
  const email = req.body.email;
  const nextadminemail = req.body.nextadminemail;

  if (typeof email !== 'string') {
    return res.status(400).send('Email required');
  }

  const memberIndex = group.members.findIndex(
    member => member.toLowerCase() === email.toLowerCase()
  );

  if (memberIndex === -1) {
    return res.status(400).send('Not a group member');
  }

  const isAdmin =
    group.adminemail.toLowerCase() === email.toLowerCase();

  if (isAdmin && group.members.length > 1) {
    if (nextadminemail) {
      if (typeof nextadminemail !== 'string') {
        return res.status(400).send('Invalid next owner');
      }

      const selectedMember = group.members.find(
        member => member.toLowerCase() ===nextadminemail.toLowerCase()
      );

      if (!selectedMember ||
          selectedMember.toLowerCase() === email.toLowerCase()) {
        return res.status(400).send('Choose another group member');
      }

      group.adminemail = selectedMember;
    } else {
      group.adminemail = group.members.find(
        member => member.toLowerCase() !== email.toLowerCase()
      );
    }
  }

  group.members.splice(memberIndex, 1);

  if (group.members.length === 0) {
    groups.splice(groups.indexOf(group), 1);

    return res.send('Group deactivated');
  }

  res.json({
    message: 'Left group successfully',
    newAdmin: group.adminemail
  });
});





app.listen(5432, () => {
  console.log('Status RUNNING ON PORT 5432');
});