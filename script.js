
let currentPasswordValue = '';
let currentUserEmail = '';
let accountVerified = false;
let profilePhoto = '';

// Notifications start with a few samples; joining/leaving groups adds new ones.
const notifications = [
  {title:'Group Announcement', msg:'CSCE 3444 Study Group has a new announcement.', time:'2m ago', unread:true},
  {title:'Sarah joined', msg:'Sarah joined your Gaming Enthusiasts group.', time:'15m ago', unread:true},
  {title:'Group Announcement', msg:'Math 1720 Study Buddies posted a new message.', time:'1h ago', unread:true}
];

const groups = [
  {id:1,name:"CSCE 3444 Study Group",members:5,category:"course",desc:"Study together for CSCE 3444.",joined:true},
  {id:2,name:"Gaming Enthusiasts",members:12,category:"hobby",desc:"Meet other UNT gamers.",joined:true},
  {id:3,name:"Math 1720 Study Buddies",members:9,category:"course",desc:"Work through homework together.",joined:true},
  {id:4,name:"UNT Cybersecurity Club",members:18,category:"hobby",desc:"Cybersecurity, labs, and competitions.",joined:false},
  {id:5,name:"Photography & Art",members:8,category:"hobby",desc:"Share projects and creative ideas.",joined:false}
];

// Returns true only for UNT email addresses
function isUntEmail(email){
  return /^[^\s@]+@(my\.)?unt\.edu$/i.test(email);
}

function show(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  closeDrawer();
  if(id==='home') renderGroups();
  if(id==='groups') renderJoined();
  if(id==='profile') renderProfileGroups();
  if(id==='notifications'){ renderNotifications(); markNotificationsRead(); }
}
function navigate(id){show(id)}
function toggleDrawer(){document.getElementById('drawer').classList.toggle('open')}
function closeDrawer(){document.getElementById('drawer').classList.remove('open')}

function toast(message){
  const t=document.getElementById('toast');
  t.textContent=message;t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),1800);
}
function login(){
  const email=document.getElementById('loginEmail').value.trim();
  const pass=document.getElementById('loginPassword').value;
  if(!email || !pass){toast('Please enter your email and password.');return}
  if(!isUntEmail(email)){toast('Please use your UNT email (@my.unt.edu or @unt.edu).');return}
  // If this email already has a password in this session, it must match.
  if(email.toLowerCase() === currentUserEmail.toLowerCase() && pass !== currentPasswordValue){
    toast('Incorrect password. Please use your current password.');
    return;
  }
  document.getElementById('profileEmail').textContent=email;
  if(!currentUserEmail){ currentUserEmail = email; currentPasswordValue = pass; }
  show('home');
  toast('Logged in successfully.');
}
function register(){
  const name=document.getElementById('regName').value.trim();
  const email=document.getElementById('regEmail').value.trim();
  const p=document.getElementById('regPass').value;
  const c=document.getElementById('regConfirm').value;
  if(!name||!email||!p||!c){toast('Please complete all fields.');return}
  if(!isUntEmail(email)){toast('Please use your UNT email (@my.unt.edu or @unt.edu).');return}
  if(p.length < 8){toast('Password must be at least 8 characters.');return}
  if(p!==c){toast('Passwords do not match.');return}
  document.getElementById('profileName').value=name;
  document.getElementById('profileEmail').textContent=email;
  currentUserEmail = email;
  currentPasswordValue = p;
  accountVerified = false;
  document.getElementById('verificationStatus').textContent = 'Not verified';
  show('home');toast('Account created.');
}
function logout(){
  show('login');toast('Logged out.');
}
function renderGroups(){
  const list=document.getElementById('groupList');
  const q=document.getElementById('searchInput').value.toLowerCase();
  const f=document.getElementById('filter').value;
  const matches=groups.filter(g=>
    (f==='all'||g.category===f) &&
    (g.name.toLowerCase().includes(q)||g.desc.toLowerCase().includes(q))
  );
  list.innerHTML=matches.map(g=>`
    <div class="group-card">
      <div class="group-row">
        <div class="group-icon">👥</div>
        <div>
          <div class="group-name">${g.name}</div>
          <div class="group-meta">${g.members} members • ${g.category==='course'?'Course':'Hobby'}</div>
        </div>
      </div>
      <div class="helper" style="margin-top:9px">${g.desc}</div>
      <div class="group-actions">
        ${g.joined
          ? '<button class="leave-btn" onclick="leaveGroup('+g.id+')">LEAVE</button>'
          : '<button class="join-btn" onclick="joinGroup('+g.id+')">JOIN</button>'}
      </div>
    </div>
  `).join('') || '<div class="empty">No groups found.</div>';
}
function renderJoined(){
  const list=document.getElementById('joinedList');
  const joined=groups.filter(g=>g.joined);
  list.innerHTML=joined.length ? joined.map(g=>`
    <div class="group-card">
      <div class="group-row">
        <div class="group-icon">👥</div>
        <div>
          <div class="group-name">${g.name}</div>
          <div class="group-meta">${g.members} members</div>
        </div>
      </div>
      <div class="group-actions"><button class="leave-btn" onclick="leaveGroup(${g.id})">LEAVE</button></div>
    </div>
  `).join('') : '<div class="empty">You have not joined any groups yet.</div>';
}
function joinGroup(id){
  const g=groups.find(x=>x.id===id); if(!g)return;
  g.joined=true;g.members++;
  addNotification('Joined group','You joined '+g.name+'.');
  renderGroups();toast('Joined '+g.name+'.');
}
function leaveGroup(id){
  const g=groups.find(x=>x.id===id); if(!g)return;
  g.joined=false;g.members=Math.max(0,g.members-1);
  addNotification('Left group','You left '+g.name+'.');
  renderGroups();renderJoined();toast('Left '+g.name+'.');
}
function saveProfile(){
  const name=document.getElementById('profileName').value.trim();
  if(!name){toast('Please enter a display name.');return}
  // Name, about, hobbies/classes and photo stay in this page until the backend is connected.
  toast('Profile saved.');
}
function previewPhoto(){
  const file=document.getElementById('photoInput').files[0];
  if(!file) return;
  if(!file.type.startsWith('image/')){toast('Please choose an image file.');return}
  if(file.size > 500*1024){toast('Picture must be under 500 KB.');return}
  const reader=new FileReader();
  reader.onload=function(){
    profilePhoto=reader.result;
    const avatar=document.getElementById('avatar');
    avatar.style.backgroundImage='url('+profilePhoto+')';
    avatar.textContent='';
  };
  reader.readAsDataURL(file);
}
function renderProfileGroups(){
  const box=document.getElementById('profileGroups');
  const joined=groups.filter(g=>g.joined);
  box.innerHTML=joined.length ? joined.map(g=>'<div>• '+g.name+'</div>').join('') : '<div class="helper">No groups joined yet.</div>';
}
function sendReset(){
  const email=document.getElementById('forgotEmail').value.trim();
  if(!email){toast('Please enter your email.');return}
  if(!isUntEmail(email)){toast('Please use your UNT email (@my.unt.edu or @unt.edu).');return}
  toast('If that account exists, a reset link was sent (demo).');
  show('login');
}
function addNotification(title,msg){
  notifications.unshift({title:title,msg:msg,time:'Just now',unread:true});
  updateBadge();
}
function renderNotifications(){
  const list=document.getElementById('notificationList');
  list.innerHTML=notifications.length ? notifications.map(n=>`
    <div class="notification ${n.unread?'unread':''}">
      <div class="bell">♧</div>
      <div><p><b>${n.title}</b><br>${n.msg}</p><time>${n.time}</time></div>
    </div>
  `).join('') : '<div class="empty">No notifications yet.</div>';
}
function markNotificationsRead(){
  notifications.forEach(n=>n.unread=false);
  updateBadge();
}
function updateBadge(){
  const count=notifications.filter(n=>n.unread).length;
  const badge=document.getElementById('notifBadge');
  badge.textContent=count;
  badge.classList.toggle('hidden',count===0);
}
renderGroups();
updateBadge();


function updatePassword(){
  const current = document.getElementById('currentPassword').value;
  const next = document.getElementById('newPassword').value;
  const confirm = document.getElementById('confirmNewPassword').value;
  if(!current || !next || !confirm){toast('Please complete all password fields.');return}
  if(current !== currentPasswordValue){toast('Current password is incorrect.');return}
  if(next.length < 8){toast('New password must be at least 8 characters.');return}
  if(next !== confirm){toast('New passwords do not match.');return}
  if(next === current){toast('Choose a different new password.');return}
  currentPasswordValue = next;
  document.getElementById('currentPassword').value = '';
  document.getElementById('newPassword').value = '';
  document.getElementById('confirmNewPassword').value = '';
  toast('Password updated for this demo session.');
}

function verifyAccount(){
  accountVerified = true;
  document.getElementById('verificationStatus').textContent = 'Verified (demo)';
  toast('Account marked as verified for this demo.');
}
