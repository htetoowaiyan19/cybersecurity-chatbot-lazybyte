const contentData = {
  "1": { title: "1. Introduction", content: "<h2>1. Introduction</h2><p>Welcome to our Terms of Use page...</p>" },
  "1.1": { title: "1.1 Overview", content: "<h3>1.1 Overview</h3><p>This service provides an AI-powered chatbot to assist users with information and conversation.</p>" },
  "1.2": { title: "1.2 Scope", content: "<h3>1.2 Scope</h3><p>The scope of these terms includes your usage of this platform, services, and data interactions.</p>" },

  "2": { title: "2. User Responsibilities", content: "<h2>2. User Responsibilities</h2><p>By using our services, you agree to act responsibly and protect your account.</p>" },
  "2.1": { title: "2.1 Account Security", content: "<h3>2.1 Account Security</h3><p>Keep your password confidential and monitor your account activity.</p>" },
  "2.2": { title: "2.2 Acceptable Use", content: "<h3>2.2 Acceptable Use</h3><p>You must not misuse our services for spam, abuse, or illegal purposes.</p>" },
  "2.3": { title: "2.3 User Conduct", content: "<h3>2.3 User Conduct</h3><p>Maintain respectful and lawful behavior while using the service.</p>" },
  "2.3.1": { title: "2.3.1 Harassment", content: "<h4>2.3.1 Harassment</h4><p>Harassment or bullying of users or staff is strictly forbidden.</p>" },
  "2.3.2": { title: "2.3.2 Illegal Use", content: "<h4>2.3.2 Illegal Use</h4><p>Engaging in unlawful activities through our service is prohibited.</p>" },
  "2.3.3": { title: "2.3.3 System Abuse", content: "<h4>2.3.3 System Abuse</h4><p>Do not attempt to overload or hack the system.</p>" },

  "3": { title: "3. AI Behavior and Limitations", content: "<h2>3. AI Behavior and Limitations</h2><p>Understand what the AI can and cannot do.</p>" },
  "3.1": { title: "3.1 No Legal Advice", content: "<h3>3.1 No Legal Advice</h3><p>The chatbot does not offer legally binding or professional advice.</p>" },
  "3.2": { title: "3.2 Potential Bias", content: "<h3>3.2 Potential Bias</h3><p>The AI is trained on data that may contain biases; be critical of responses.</p>" },
  "3.3": { title: "3.3 Data Accuracy", content: "<h3>3.3 Data Accuracy</h3><p>We aim for accuracy, but do not guarantee all responses are correct.</p>" },

  "4": { title: "4. Privacy Policy Summary", content: "<h2>4. Privacy Policy Summary</h2><p>We care about your data and privacy.</p>" },
  "4.1": { title: "4.1 Personal Data Collection", content: "<h3>4.1 Personal Data Collection</h3><p>We collect only the necessary data to improve our service.</p>" },
  "4.2": { title: "4.2 Use of Cookies", content: "<h3>4.2 Use of Cookies</h3><p>Cookies are used to maintain user sessions and preferences.</p>" },
  "4.3": { title: "4.3 Third-party Services", content: "<h3>4.3 Third-party Services</h3><p>We may use third-party analytics and hosting services.</p>" },
  "4.4": { title: "4.4 User Rights", content: "<h3>4.4 User Rights</h3><p>You may access, correct, or request deletion of your data.</p>" },

  "5": { title: "5. Termination Policy", content: "<h2>5. Termination Policy</h2><p>We reserve the right to suspend accounts that violate these terms.</p>" },
  "5.1": { title: "5.1 Grounds for Termination", content: "<h3>5.1 Grounds for Termination</h3><p>Repeated violations or abuse may lead to termination.</p>" },
  "5.2": { title: "5.2 Process", content: "<h3>5.2 Process</h3><p>We will attempt to notify users before termination when possible.</p>" },

  "6": { title: "6. Intellectual Property", content: "<h2>6. Intellectual Property</h2><p>We own the content and design of this platform.</p>" },
  "6.1": { title: "6.1 Ownership", content: "<h3>6.1 Ownership</h3><p>All content, code, and design are the property of the company.</p>" },
  "6.2": { title: "6.2 User Generated Content", content: "<h3>6.2 User Generated Content</h3><p>You own your submissions but grant us usage rights.</p>" },
  "6.3": { title: "6.3 Trademarks", content: "<h3>6.3 Trademarks</h3><p>Company names and logos are trademarks and protected by law.</p>" },

  "7": { title: "7. Disclaimers and Limitation of Liability", content: "<h2>7. Disclaimers and Limitation of Liability</h2><p>Use this service at your own risk.</p>" },
  "7.1": { title: "7.1 No Warranty", content: "<h3>7.1 No Warranty</h3><p>We provide no guarantees of performance or accuracy.</p>" },
  "7.2": { title: "7.2 Liability Limit", content: "<h3>7.2 Liability Limit</h3><p>We are not liable for indirect or consequential damages.</p>" },

  "8": { title: "8. Changes to These Terms", content: "<h2>8. Changes to These Terms</h2><p>We may revise these terms at any time.</p>" },
  "8.1": { title: "8.1 Notification", content: "<h3>8.1 Notification</h3><p>We may notify you of major changes via email or in-app messages.</p>" },
  "8.2": { title: "8.2 Continued Use", content: "<h3>8.2 Continued Use</h3><p>Your continued use of the service means acceptance of the changes.</p>" },

  "9": { title: "9. Contact Information", content: "<h2>9. Contact Information</h2><p>Contact us anytime at <a href='mailto:support@lazybytechatbot.com'>support@lazybytechatbot.com</a>.</p>" },

  "10": { title: "10. Data Protection Law", content: "<h2>10. GGDR"}

};














const nav = document.getElementById('termsNav');
const content = document.getElementById('termsContent');

// Utility: Collapse all nested uls
function collapseAllSubmenus() {
  nav.querySelectorAll('ul ul').forEach(ul => {
    ul.style.display = 'none';
    ul.parentElement.classList.remove('open');
  });
}

// Utility: Clear all .active
function clearActiveState() {
  nav.querySelectorAll('li').forEach(li => li.classList.remove('active'));
}

// Load content into the right panel
function displayContent(id) {
  content.innerHTML = contentData[id]?.content || "<p>Content not found.</p>";
}

// Expand submenu (if exists)
function toggleSubmenu(li) {
  const submenu = li.querySelector('ul');
  if (submenu) {
    const isOpen = submenu.style.display === 'block';
    submenu.style.display = isOpen ? 'none' : 'block';
    li.classList.toggle('open', !isOpen);
  }
}

// Smooth scroll to selected nav item
function scrollToItem(li) {
  const offsetY = -90; // adjust to match fixed header
  const top = li.getBoundingClientRect().top + window.scrollY + offsetY;
  window.scrollTo({ top, behavior: 'smooth' });
}

// Handle click on nav items
function handleNavClick(event) {
  const li = event.target.closest('li');
  if (!li) return;

  const id = li.dataset.id;
  if (!id) return;

  toggleSubmenu(li);       // toggle if it has children
  clearActiveState();      // remove all active
  li.classList.add('active');
  displayContent(id);      // update right panel

  // Optional: auto scroll to nav item
  setTimeout(() => scrollToItem(li), 50);
}

// Initial setup
function initTermsNav() {
  collapseAllSubmenus();

  // Open and highlight first section
  const firstLi = nav.querySelector('li[data-id="1"]');
  if (firstLi) {
    firstLi.classList.add('active', 'open');
    const firstSubmenu = firstLi.querySelector('ul');
    if (firstSubmenu) firstSubmenu.style.display = 'block';
    displayContent('1');
  }

  nav.addEventListener('click', handleNavClick);
}

window.addEventListener('DOMContentLoaded', initTermsNav);
