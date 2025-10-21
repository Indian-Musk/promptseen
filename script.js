// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDWDn4T6tkk8ihjLX8Y_YHMkz7y2Uw9paQ",
  authDomain: "clone-8d83d.firebaseapp.com",
  projectId: "clone-8d83d",
  storageBucket: "clone-8d83d.appspot.com",
  messagingSenderId: "263963146412",
  appId: "1:263963146412:web:c83a284115414a2c44c709",
  measurementId: "G-C3CMBQR6GH"
};

// Add this to your existing script.js file or include it in a script tag
document.addEventListener('DOMContentLoaded', function() {
    // Add scroll effect to header for desktop
    const header = document.getElementById('mainHeader');
    
    function handleScroll() {
        if (window.scrollY > 10) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
    
    // Apply scroll effect for desktop
    if (window.innerWidth >= 769) {
        window.addEventListener('scroll', handleScroll);
    }
    
    // Re-apply on resize
    window.addEventListener('resize', function() {
        if (window.innerWidth >= 769) {
            window.addEventListener('scroll', handleScroll);
        } else {
            window.removeEventListener('scroll', handleScroll);
            header.classList.remove('scrolled');
        }
    });
});

// Track Firebase initialization state
let firebaseInitialized = false;

// Initialize Firebase
async function initializeFirebase() {
  if (typeof firebase === 'undefined') {
    console.error('Firebase SDK not loaded');
    return false;
  }
  
  if (!firebaseInitialized && firebase.apps.length === 0) {
    try {
      firebase.initializeApp(firebaseConfig);
      firebaseInitialized = true;
      console.log('Firebase initialized successfully');
    } catch (error) {
      console.error('Firebase initialization error:', error);
    }
  }
  
  return firebaseInitialized;
}

// Get current user
async function getCurrentUser() {
  await initializeFirebase();
  
  return new Promise((resolve) => {
    const unsubscribe = firebase.auth().onAuthStateChanged(user => {
      unsubscribe();
      resolve(user);
    });
  });
}

// Authentication functions
function checkAuth() {
  return JSON.parse(localStorage.getItem('user'));
}

function showAuthElements() {
  const user = checkAuth();
  const authSection = document.getElementById('authSection');
  const uploadButton = document.getElementById('openUploadModal');
  const newsUploadButton = document.getElementById('openNewsModal');
  
  if (authSection) {
    if (user) {
      authSection.innerHTML = `
        <div class="user-profile">
          <img src="${user.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzYiIGhlaWdodD0iMzYiIHZpZXdCb3g9IjAgMCAzNiAzNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTgiIGN5PSIxOCIgcj0iMTgiIGZpbGw9IiM0ZTU0YzgiLz4KPGNpcmNsZSBjeD0iMTgiIGN5PSIxNCIgcj0iNSIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTI2IDI4QzI2IDI0LjY4NjMgMjIuNDE4MyAyMiAxOCAyMkMxMy41ODE3IDIyIDEwIDI0LjY4NjMgMTAgMjgiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo='}"  
               alt="${user.name}" 
               class="user-avatar"
               onerror="this.src='https://via.placeholder.com/36x36/4e54c8/white?text=U'">
          <span>${user.name}</span>
          <button class="logout-btn" title="Logout"><i class="fas fa-sign-out-alt"></i></button>
        </div>
      `;
      
      const logoutBtn = authSection.querySelector('.logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
          try {
            await firebase.auth().signOut();
            localStorage.removeItem('user');
            window.location.reload();
          } catch (error) {
            console.error('Logout error:', error);
            localStorage.removeItem('user');
            window.location.reload();
          }
        });
      }
    } else {
      authSection.innerHTML = `
        <a href="login.html" class="login-btn">Login</a>
      `;
    }
  }
  
  if (uploadButton) {
    uploadButton.style.display = user ? 'flex' : 'none';
  }
  
  if (newsUploadButton) {
    newsUploadButton.style.display = user ? 'flex' : 'none';
  }
}

// YouTube-style Category Manager
class CategoryManager {
    constructor() {
        this.defaultCategories = ['photography'];
        this.searchCategories = [];
        this.maxSearchCategories = 10;
        this.currentCategory = 'all';
        this.init();
    }

    init() {
        this.loadUserCategories();
        this.renderCategories();
        this.setupEventListeners();
        this.updateNavigation();
    }

    loadUserCategories() {
        // Load user's search history categories
        const userCategories = localStorage.getItem('userSearchCategories');
        if (userCategories) {
            this.searchCategories = JSON.parse(userCategories);
        }
    }

    saveUserCategories() {
        localStorage.setItem('userSearchCategories', JSON.stringify(this.searchCategories));
    }

    addSearchCategory(searchTerm) {
        if (!searchTerm || searchTerm.trim() === '') return;

        const category = searchTerm.toLowerCase().trim();
        
        // Don't add if it's already in default categories
        if (this.defaultCategories.includes(category)) return;

        // Remove if already exists (to move to front)
        const existingIndex = this.searchCategories.indexOf(category);
        if (existingIndex > -1) {
            this.searchCategories.splice(existingIndex, 1);
        }

        // Add to beginning
        this.searchCategories.unshift(category);

        // Limit the number of search categories
        if (this.searchCategories.length > this.maxSearchCategories) {
            this.searchCategories = this.searchCategories.slice(0, this.maxSearchCategories);
        }

        this.saveUserCategories();
        this.renderCategories();
    }

    renderCategories() {
        const categoriesTrack = document.getElementById('categoriesTrack');
        if (!categoriesTrack) return;

        const allCategories = [...this.defaultCategories, ...this.searchCategories];
        
        categoriesTrack.innerHTML = allCategories.map(category => {
            const displayName = this.getCategoryDisplayName(category);
            const isActive = category === this.currentCategory;
            
            return `
                <button class="category-btn ${isActive ? 'active' : ''}" 
                        data-category="${category}">
                    ${displayName}
                </button>
            `;
        }).join('');
    }

    getCategoryDisplayName(category) {
        const displayNames = {
          
            'photography': 'Photography',
            
        };
        
        return displayNames[category] || this.capitalizeFirstLetter(category);
    }

    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    setupEventListeners() {
        // Category button clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('.category-btn')) {
                const categoryBtn = e.target.closest('.category-btn');
                const category = categoryBtn.dataset.category;
                this.selectCategory(category);
            }
        });

        // Navigation arrows
        const prevBtn = document.getElementById('categoryPrev');
        const nextBtn = document.getElementById('categoryNext');
        const scrollContainer = document.getElementById('categoriesScroll');

        if (prevBtn && nextBtn && scrollContainer) {
            prevBtn.addEventListener('click', () => {
                this.scrollCategories(-200);
            });

            nextBtn.addEventListener('click', () => {
                this.scrollCategories(200);
            });

            // Show/hide arrows based on scroll position
            scrollContainer.addEventListener('scroll', () => {
                this.updateNavigation();
            });
        }

        // Handle window resize
        window.addEventListener('resize', () => {
            this.updateNavigation();
        });
    }

    scrollCategories(distance) {
        const scrollContainer = document.getElementById('categoriesScroll');
        if (scrollContainer) {
            scrollContainer.scrollBy({
                left: distance,
                behavior: 'smooth'
            });
        }
    }

    updateNavigation() {
        if (window.innerWidth <= 768) return; // Don't show arrows on mobile

        const scrollContainer = document.getElementById('categoriesScroll');
        const prevBtn = document.getElementById('categoryPrev');
        const nextBtn = document.getElementById('categoryNext');

        if (!scrollContainer || !prevBtn || !nextBtn) return;

        const scrollLeft = scrollContainer.scrollLeft;
        const scrollWidth = scrollContainer.scrollWidth;
        const clientWidth = scrollContainer.clientWidth;

        // Show/hide previous button
        if (scrollLeft <= 10) {
            prevBtn.classList.add('hidden');
        } else {
            prevBtn.classList.remove('hidden');
        }

        // Show/hide next button
        if (scrollLeft >= scrollWidth - clientWidth - 10) {
            nextBtn.classList.add('hidden');
        } else {
            nextBtn.classList.remove('hidden');
        }
    }

    selectCategory(category) {
        this.currentCategory = category;
        
        // Update active state
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`[data-category="${category}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        // Filter prompts based on category
        this.filterPromptsByCategory(category);
        
        // Show notification for search-based categories
        if (!this.defaultCategories.includes(category)) {
            showNotification(`Showing results for: ${this.getCategoryDisplayName(category)}`, 'info');
        }
    }

    filterPromptsByCategory(category) {
        if (window.youtubePrompts) {
            // Reset to first page
            youtubePrompts.currentPage = 1;
            youtubePrompts.hasMore = true;
            
            if (category === 'all') {
                // Show all prompts
                youtubePrompts.loadInitialPrompts();
            } else if (this.defaultCategories.includes(category)) {
                // Filter by default category
                youtubePrompts.filterByCategory(category);
            } else {
                // Filter by search term (dynamic category)
                youtubePrompts.filterBySearchTerm(category);
            }
        }
    }
}

// News Manager Class
class NewsManager {
  constructor() {
    this.currentPage = 1;
    this.hasMore = true;
    this.isLoading = false;
  }
  
  async loadNews() {
    try {
      this.showLoading();
      const response = await fetch(`/api/news?page=${this.currentPage}&limit=6`);
      const data = await response.json();
      
      this.displayNews(data.news);
      this.hasMore = data.hasMore;
    } catch (error) {
      console.error('Error loading news:', error);
      this.showError();
    }
  }
  
  displayNews(news) {
    const newsContainer = document.getElementById('newsContainer');
    if (!newsContainer) return;
    
    if (news.length === 0) {
      newsContainer.innerHTML = `
        <div class="no-news" style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #666;">
          <i class="fas fa-newspaper" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.5;"></i>
          <h3>No News Yet</h3>
          <p>Be the first to publish AI news and updates!</p>
        </div>
      `;
      return;
    }
    
    newsContainer.innerHTML = news.map(item => `
      <div class="news-card" data-news-id="${item.id}">
        ${item.isBreaking ? '<span class="breaking-badge">BREAKING</span>' : ''}
        ${item.isFeatured ? '<span class="featured-badge">FEATURED</span>' : ''}
        <img src="${item.imageUrl}" alt="${item.title}" class="news-image" loading="lazy">
        <div class="news-content">
          <h3 class="news-title">${item.title}</h3>
          <p class="news-excerpt">${item.excerpt}</p>
          <div class="news-meta">
            <span class="news-author">By ${item.author}</span>
            <span class="news-date">${new Date(item.publishedAt).toLocaleDateString()}</span>
          </div>
          <div class="news-stats">
            <span class="news-views"><i class="fas fa-eye"></i> ${this.formatCount(item.views)}</span>
            <a href="/news/${item.id}" class="read-more">Read More <i class="fas fa-arrow-right"></i></a>
          </div>
        </div>
      </div>
    `).join('');
  }
  
  showLoading() {
    const newsContainer = document.getElementById('newsContainer');
    if (!newsContainer) return;
    
    newsContainer.innerHTML = `
      <div class="news-loading" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
        <div class="spinner"></div>
        <p>Loading latest news...</p>
      </div>
    `;
  }
  
  showError() {
    const newsContainer = document.getElementById('newsContainer');
    if (!newsContainer) return;
    
    newsContainer.innerHTML = `
      <div class="news-error" style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #666;">
        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px;"></i>
        <h3>Failed to load news</h3>
        <p>Please try again later</p>
        <button onclick="newsManager.loadNews()" class="retry-btn" style="margin-top: 15px;">
          <i class="fas fa-redo"></i> Retry
        </button>
      </div>
    `;
  }
  
  formatCount(count) {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  }
}

// News Image Preview Functionality
function initNewsImagePreview() {
  const newsImageUpload = document.getElementById('newsImageUpload');
  const newsImagePreview = document.getElementById('newsImagePreview');
  
  if (newsImageUpload && newsImagePreview) {
    // File input change event
    newsImageUpload.addEventListener('change', function() {
      const file = this.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          newsImagePreview.src = e.target.result;
          newsImagePreview.style.display = 'block';
        }
        reader.readAsDataURL(file);
      } else {
        newsImagePreview.style.display = 'none';
      }
    });
    
    // Drag and drop functionality
    const fileUploadArea = document.querySelector('#newsUploadModal .file-upload');
    if (fileUploadArea) {
      fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadArea.style.borderColor = '#4e54c8';
        fileUploadArea.style.background = 'rgba(78, 84, 200, 0.05)';
      });
      
      fileUploadArea.addEventListener('dragleave', () => {
        fileUploadArea.style.borderColor = '#ddd';
        fileUploadArea.style.background = '';
      });
      
      fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadArea.style.borderColor = '#ddd';
        fileUploadArea.style.background = '';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          newsImageUpload.files = files;
          const event = new Event('change', { bubbles: true });
          newsImageUpload.dispatchEvent(event);
        }
      });
    }
  }
}

// News Upload Modal Functionality
function initNewsUploadModal() {
  const newsModal = document.getElementById('newsUploadModal');
  const openNewsBtn = document.getElementById('openNewsModal');
  const closeNewsModalBtn = document.getElementById('closeNewsModal');
  const newsForm = document.getElementById('newsForm');
  
  if (openNewsBtn && newsModal) {
    openNewsBtn.addEventListener('click', () => {
      const user = checkAuth();
      if (!user) {
        alert('Please login to publish news');
        window.location.href = 'login.html?returnUrl=' + encodeURIComponent(window.location.href);
        return;
      }
      
      newsModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  }
  
  if (closeNewsModalBtn && newsModal) {
    closeNewsModalBtn.addEventListener('click', () => {
      newsModal.classList.remove('active');
      document.body.style.overflow = '';
    });
  }
  
  if (newsModal) {
    newsModal.addEventListener('click', (e) => {
      if (e.target === newsModal) {
        newsModal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }
  
  if (newsForm) {
    newsForm.addEventListener('submit', handleNewsSubmit);
  }
  
  // Initialize image preview for news upload
  initNewsImagePreview();
}

async function handleNewsSubmit(e) {
  e.preventDefault();
  
  const user = checkAuth();
  if (!user) {
    alert('Please login to publish news');
    return;
  }
  
  const title = document.getElementById('newsTitle').value;
  const content = document.getElementById('newsContent').value;
  const excerpt = document.getElementById('newsExcerpt').value;
  const category = document.getElementById('newsCategory').value;
  const tags = document.getElementById('newsTags').value;
  const isBreaking = document.getElementById('isBreaking').checked;
  const isFeatured = document.getElementById('isFeatured').checked;
  const file = document.getElementById('newsImageUpload').files[0];
  
  if (!title || !content) {
    alert('Please fill in title and content');
    return;
  }
  
  try {
    const submitBtn = document.querySelector('#newsForm .submit-btn');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publishing...';
    submitBtn.disabled = true;
    
    await initializeFirebase();
    const firebaseUser = await getCurrentUser();
    
    if (!firebaseUser) {
      throw new Error('User not authenticated');
    }
    
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('excerpt', excerpt);
    formData.append('category', category);
    formData.append('tags', tags);
    formData.append('isBreaking', isBreaking);
    formData.append('isFeatured', isFeatured);
    formData.append('author', user.name);
    if (file) formData.append('image', file);
    
    const response = await fetch('/api/upload-news', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`News publication failed with status ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      const newsModal = document.getElementById('newsUploadModal');
      const newsForm = document.getElementById('newsForm');
      const newsImagePreview = document.getElementById('newsImagePreview');
      
      newsModal.classList.remove('active');
      document.body.style.overflow = '';
      newsForm.reset();
      
      // Hide the image preview
      if (newsImagePreview) {
        newsImagePreview.style.display = 'none';
      }
      
      showNotification('News published successfully!', 'success');
      
      // Refresh news section
      if (window.newsManager) {
        newsManager.loadNews();
      }
    }
  } catch (error) {
    console.error('News publication error:', error);
    showNotification(`News publication failed: ${error.message}`, 'error');
  } finally {
    const submitBtn = document.querySelector('#newsForm .submit-btn');
    if (submitBtn) {
      submitBtn.innerHTML = '<i class="fas fa-newspaper"></i> Publish News';
      submitBtn.disabled = false;
    }
  }
}

// YouTube-style Prompts with Infinite Scroll
class YouTubeStylePrompts {
  constructor() {
    this.currentPage = 1;
    this.isLoading = false;
    this.hasMore = true;
    this.promptsPerPage = 4;
    this.allPrompts = [];
    this.filteredPrompts = null;
    this.loadedPrompts = new Set();
    this.init();
  }

  init() {
    this.injectCriticalCSS();
    this.setupInfiniteScroll();
    this.loadInitialPrompts();
    this.setupEngagementListeners();
    console.log('YouTubeStylePrompts initialized');
  }

  injectCriticalCSS() {
    const criticalCSS = `
      /* YouTube Shorts Critical Styles with !important */
      .shorts-container {
        display: grid !important;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)) !important;
        gap: 20px !important;
        padding: 20px !important;
        max-width: 100% !important;
        margin: 0 auto !important;
        width: 100% !important;
      }

      .shorts-prompt-card {
        position: relative !important;
        background: white !important;
        border-radius: 12px !important;
        overflow: hidden !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
        width: 100% !important;
        margin: 0 !important;
        display: block !important;
        transition: transform 0.3s ease !important;
      }

      .shorts-prompt-card:hover {
        transform: translateY(-5px) !important;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
      }

      .shorts-video-container {
        position: relative !important;
        width: 100% !important;
        height: 400px !important;
        background: #000 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }

      .shorts-image {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
        display: block !important;
      }

      .shorts-engagement {
        position: absolute !important;
        right: 12px !important;
        bottom: 80px !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 15px !important;
        align-items: center !important;
        z-index: 10 !important;
      }

      .engagement-action {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        gap: 4px !important;
        color: white !important;
        background: none !important;
        border: none !important;
        cursor: pointer !important;
        padding: 0 !important;
        font-size: 12px !important;
        transition: transform 0.2s ease !important;
      }

      .engagement-action:hover {
        transform: scale(1.1) !important;
      }

      .engagement-action i {
        font-size: 18px !important;
        background: rgba(0, 0, 0, 0.5) !important;
        border-radius: 50% !important;
        padding: 8px !important;
        width: 36px !important;
        height: 36px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        backdrop-filter: blur(10px) !important;
      }

      .engagement-count {
        font-size: 11px !important;
        font-weight: 500 !important;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.8) !important;
      }

      .shorts-info {
        padding: 15px !important;
        background: white !important;
        display: block !important;
      }

      .shorts-prompt-text {
        font-size: 14px !important;
        line-height: 1.4 !important;
        margin-bottom: 10px !important;
        display: -webkit-box !important;
        -webkit-line-clamp: 3 !important;
        -webkit-box-orient: vertical !important;
        overflow: hidden !important;
        color: #0f0f0f !important;
        min-height: 60px !important;
      }

      .shorts-meta {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        font-size: 12px !important;
        color: #606060 !important;
        margin-bottom: 8px !important;
      }

      .prompt-actions {
        margin-top: 10px !important;
        display: flex !important;
        gap: 10px !important;
        width: 100% !important;
        align-items: center !important;
      }

      .copy-prompt-btn {
        padding: 8px 16px !important;
        border: 1px solid #ddd !important;
        border-radius: 20px !important;
        background: white !important;
        font-size: 12px !important;
        cursor: pointer !important;
        transition: all 0.3s ease !important;
        display: flex !important;
        align-items: center !important;
        gap: 6px !important;
        font-weight: 500 !important;
      }

      .copy-prompt-btn:hover {
        background: #4e54c8 !important;
        color: white !important;
        border-color: #4e54c8 !important;
      }

      /* Loading states */
      .loading-shorts {
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        padding: 40px !important;
        color: #666 !important;
        width: 100% !important;
        grid-column: 1 / -1 !important;
      }

      .loading-shorts .spinner {
        width: 24px !important;
        height: 24px !important;
        border: 3px solid #f3f3f3 !important;
        border-top: 3px solid #4e54c8 !important;
        border-radius: 50% !important;
        animation: spin 1s linear infinite !important;
        margin-right: 12px !important;
      }

      .loading-prompt .shorts-video-container {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%) !important;
        background-size: 200% 100% !important;
        animation: loading 1.5s infinite !important;
      }

      .loading-text {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%) !important;
        background-size: 200% 100% !important;
        animation: loading 1.5s infinite !important;
        border-radius: 4px !important;
      }

      /* Desktop specific styles */
      @media (min-width: 1024px) {
        .shorts-container {
          grid-template-columns: repeat(4, 1fr) !important;
          gap: 24px !important;
          padding: 24px !important;
          max-width: 1400px !important;
        }

        .shorts-video-container {
          height: 350px !important;
        }

        .shorts-prompt-text {
          -webkit-line-clamp: 4 !important;
          min-height: 80px !important;
        }
      }

      @media (min-width: 768px) and (max-width: 1023px) {
        .shorts-container {
          grid-template-columns: repeat(2, 1fr) !important;
          gap: 20px !important;
          padding: 20px !important;
        }

        .shorts-video-container {
          height: 400px !important;
        }
      }

      /* Mobile responsive */
      @media (max-width: 767px) {
        .shorts-container {
          grid-template-columns: 1fr !important;
          gap: 16px !important;
          padding: 16px !important;
        }
        
        .shorts-video-container {
          height: 500px !important;
        }
        
        .shorts-prompt-card {
          border-radius: 8px !important;
        }
        
        .engagement-action i {
          font-size: 20px !important;
          width: 40px !important;
          height: 40px !important;
        }

        .shorts-prompt-text {
          -webkit-line-clamp: 2 !important;
          min-height: 50px !important;
        }
      }

      @media (max-width: 480px) {
        .shorts-video-container {
          height: 450px !important;
        }
        
        .shorts-info {
          padding: 12px !important;
        }
        
        .shorts-prompt-text {
          font-size: 13px !important;
        }
      }

      /* Animations */
      @keyframes spin {
        0% { transform: rotate(0deg) !important; }
        100% { transform: rotate(360deg) !important; }
      }

      @keyframes loading {
        0% { background-position: 200% 0 !important; }
        100% { background-position: -200% 0 !important; }
      }

      .count-animation {
        animation: countPop 0.3s ease !important;
      }

      @keyframes countPop {
        0% { transform: scale(1) !important; }
        50% { transform: scale(1.2) !important; }
        100% { transform: scale(1) !important; }
      }

      /* Override any grid layouts */
      #promptsContainer {
        display: grid !important;
        width: 100% !important;
      }

      /* Hide any existing grid styles */
      .prompts-grid {
        display: none !important;
      }

      .prompt-card {
        display: none !important;
      }

      /* Ensure proper image loading */
      .shorts-image {
        transition: opacity 0.3s ease !important;
      }

      .shorts-image:not([src]) {
        opacity: 0 !important;
      }

      .shorts-image[src] {
        opacity: 1 !important;
      }
    `;

    const style = document.createElement('style');
    style.id = 'youtube-shorts-critical-css';
    style.textContent = criticalCSS;
    document.head.appendChild(style);
  }

  setupInfiniteScroll() {
    let ticking = false;
    
    const checkScroll = () => {
      if (this.isLoading || !this.hasMore) return;

      const scrollPosition = window.innerHeight + window.scrollY;
      const pageHeight = document.documentElement.scrollHeight - 100;

      if (scrollPosition >= pageHeight) {
        console.log('Loading more prompts...');
        this.loadMorePrompts();
      }
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          checkScroll();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    // Also check on load in case content doesn't fill the screen
    window.addEventListener('load', () => {
      setTimeout(() => this.checkScrollPosition(), 1000);
    });
  }

  checkScrollPosition() {
    const scrollPosition = window.innerHeight + window.scrollY;
    const pageHeight = document.documentElement.scrollHeight;
    
    if (scrollPosition >= pageHeight - 200 && this.hasMore && !this.isLoading) {
      this.loadMorePrompts();
    }
  }

  async loadInitialPrompts() {
    const promptsContainer = document.getElementById('promptsContainer');
    if (!promptsContainer) {
      console.error('Prompts container not found');
      return;
    }

    console.log('Loading initial prompts...');
    
    // Clear any existing content and apply critical styles
    promptsContainer.innerHTML = '';
    promptsContainer.className = 'shorts-container';
    
    // Add loading skeletons - ensure 4 loading cards for desktop
    promptsContainer.innerHTML = this.createLoadingShorts();

    try {
      await this.loadAllPrompts();
      const initialPrompts = this.allPrompts.slice(0, this.promptsPerPage);
      console.log(`Loaded ${initialPrompts.length} initial prompts`);
      this.displayPrompts(initialPrompts, true);
    } catch (error) {
      console.error('Error loading initial prompts:', error);
      this.showErrorState();
    }
  }

  async loadAllPrompts() {
    try {
      console.log('Fetching all prompts from API...');
      const user = await getCurrentUser();
      const userId = user?.uid || null;
      const params = new URLSearchParams({
        page: '1',
        limit: '100',
        ...(userId && { userId })
      });
      
      const response = await fetch(`/api/uploads?${params}`);
      if (response.ok) {
        const data = await response.json();
        this.allPrompts = data.uploads || [];
        console.log(`Loaded ${this.allPrompts.length} prompts from API`);
      } else {
        throw new Error('Failed to fetch prompts');
      }
    } catch (error) {
      console.error('API fetch error:', error);
      // Fallback to mock data
      this.allPrompts = this.generateMockPrompts(50);
      console.log(`Generated ${this.allPrompts.length} mock prompts`);
    }
  }

  async loadMorePrompts() {
    if (this.isLoading || !this.hasMore) {
      console.log('Already loading or no more prompts');
      return;
    }

    this.isLoading = true;
    this.showLoadingIndicator();
    console.log(`Loading page ${this.currentPage + 1}...`);

    try {
      // Simulate API delay for better UX
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const promptsToUse = this.filteredPrompts || this.allPrompts;
      const startIndex = this.currentPage * this.promptsPerPage;
      const nextPrompts = promptsToUse.slice(startIndex, startIndex + this.promptsPerPage);
      
      if (nextPrompts.length > 0) {
        console.log(`Displaying ${nextPrompts.length} more prompts`);
        this.displayPrompts(nextPrompts, false);
        this.currentPage++;
        
        // Check if we need to load more immediately (for short screens)
        setTimeout(() => this.checkScrollPosition(), 500);
      } else {
        console.log('No more prompts to load');
        this.hasMore = false;
        this.hideLoadingIndicator();
        this.showNoMorePrompts();
      }
    } catch (error) {
      console.error('Error loading more prompts:', error);
      this.hideLoadingIndicator();
      showNotification('Failed to load more prompts', 'error');
    } finally {
      this.isLoading = false;
    }
  }

  filterByCategory(category) {
    const filteredPrompts = this.allPrompts.filter(prompt => 
      prompt.category === category
    );
    
    this.displayFilteredPrompts(filteredPrompts);
  }

  filterBySearchTerm(searchTerm) {
    const filteredPrompts = this.allPrompts.filter(prompt => {
      const searchLower = searchTerm.toLowerCase();
      return (
        prompt.title.toLowerCase().includes(searchLower) ||
        prompt.promptText.toLowerCase().includes(searchLower) ||
        (prompt.keywords && prompt.keywords.some(keyword => 
          keyword.toLowerCase().includes(searchLower)
        ))
      );
    });
    
    this.displayFilteredPrompts(filteredPrompts);
  }

  displayFilteredPrompts(filteredPrompts) {
    const promptsContainer = document.getElementById('promptsContainer');
    if (!promptsContainer) return;

    promptsContainer.innerHTML = '';
    this.loadedPrompts.clear();

    if (filteredPrompts.length === 0) {
      this.showNoResults();
      return;
    }

    const initialPrompts = filteredPrompts.slice(0, this.promptsPerPage);
    this.displayPrompts(initialPrompts, true);
    
    // Update infinite scroll to use filtered prompts
    this.filteredPrompts = filteredPrompts;
    this.hasMore = filteredPrompts.length > this.promptsPerPage;
  }

  showNoResults() {
    const promptsContainer = document.getElementById('promptsContainer');
    if (promptsContainer) {
      promptsContainer.innerHTML = `
        <div class="no-results" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
          <i class="fas fa-search" style="font-size: 3rem; color: #ccc; margin-bottom: 20px;"></i>
          <h3 style="color: #666; margin-bottom: 10px;">No prompts found</h3>
          <p style="color: #888;">Try adjusting your search or browse different categories</p>
          <button onclick="categoryManager.selectCategory('all')" 
                  class="cta-button" 
                  style="margin-top: 20px;">
            Show All Prompts
          </button>
        </div>
      `;
    }
  }

  generateMockPrompts(count) {
    const prompts = [];
    const categories = ['photography', 'design'];
    const styles = ['cyberpunk', 'fantasy', 'minimalist', 'realistic', 'anime', 'painting'];
    const adjectives = ['amazing', 'stunning', 'beautiful', 'epic', 'magnificent', 'breathtaking'];
    
    for (let i = 1; i <= count; i++) {
      const style = styles[Math.floor(Math.random() * styles.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
      
      prompts.push({
        id: `prompt-${i}`,
        title: `${adjective} ${style} ${category}`,
        promptText: `Create a ${style} ${category} image with perfect lighting, highly detailed, professional composition, trending on art station, 4K resolution, masterpiece quality`,
        imageUrl: `https://picsum.photos/300/500?random=${i}&blur=2`,
        likes: Math.floor(Math.random() * 1000),
        views: Math.floor(Math.random() * 5000),
        uses: Math.floor(Math.random() * 500),
        userName: `creator${i}`,
        category: category,
        createdAt: new Date().toISOString()
      });
    }
    
    return prompts;
  }

  displayPrompts(prompts, isInitial) {
    const promptsContainer = document.getElementById('promptsContainer');
    if (!promptsContainer) return;

    // Ensure container has correct class
    promptsContainer.className = 'shorts-container';

    if (isInitial) {
      promptsContainer.innerHTML = '';
      this.loadedPrompts.clear();
    } else {
      this.hideLoadingIndicator();
    }

    prompts.forEach((prompt, index) => {
      // Avoid duplicates
      if (this.loadedPrompts.has(prompt.id)) {
        return;
      }
      
      const promptElement = this.createShortsPrompt(prompt, index);
      promptsContainer.appendChild(promptElement);
      this.loadedPrompts.add(prompt.id);
    });

    // Animate prompts in
    setTimeout(() => {
      this.animatePromptsIn();
    }, 50);

    // Track views for new prompts
    prompts.forEach(prompt => {
      this.trackPromptView(prompt.id);
    });

    console.log(`Displayed ${prompts.length} prompts, total loaded: ${this.loadedPrompts.size}`);
  }

  createShortsPrompt(prompt, index) {
    const promptDiv = document.createElement('div');
    promptDiv.className = 'shorts-prompt-card';
    promptDiv.setAttribute('data-prompt-id', prompt.id);
    promptDiv.style.opacity = '0';
    promptDiv.style.transform = 'translateY(20px)';
    promptDiv.style.transition = `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`;

    promptDiv.innerHTML = `
      <div class="shorts-video-container">
        <img src="${prompt.imageUrl}" 
             alt="${prompt.title}"
             class="shorts-image"
             loading="lazy"
             onerror="this.src='https://via.placeholder.com/300x500/4e54c8/white?text=AI+Image'">
        
        <div class="shorts-engagement">
          <button class="engagement-action like-btn" data-prompt-id="${prompt.id}" title="Like">
            <i class="far fa-heart"></i>
            <span class="engagement-count likes-count">${this.formatCount(prompt.likes)}</span>
          </button>
          
          <button class="engagement-action use-btn" data-prompt-id="${prompt.id}" title="Mark as used">
            <i class="fas fa-download"></i>
            <span class="engagement-count uses-count">${this.formatCount(prompt.uses)}</span>
          </button>
          
          <button class="engagement-action share-btn" data-prompt-id="${prompt.id}" title="Share">
            <i class="fas fa-share"></i>
            <span class="engagement-count">Share</span>
          </button>
          
          <a href="/prompt/${prompt.id}" class="engagement-action view-btn" target="_blank" title="View details">
            <i class="fas fa-expand"></i>
            <span class="engagement-count views-count">${this.formatCount(prompt.views)}</span>
          </a>
        </div>
      </div>
      
      <div class="shorts-info">
        <div class="shorts-prompt-text">
          ${prompt.promptText}
        </div>
        <div class="shorts-meta">
          <span>@${prompt.userName}</span>
          <span>${this.formatCount(prompt.views)} views</span>
        </div>
        <div class="prompt-actions">
          <button class="copy-prompt-btn" data-prompt-text="${prompt.promptText}">
            <i class="fas fa-copy"></i> Copy Prompt
          </button>
          <span style="font-size: 11px; color: #888; margin-left: auto;">
            #${prompt.category}
          </span>
        </div>
      </div>
    `;

    return promptDiv;
  }

  setupEngagementListeners() {
    // Event delegation for all engagement buttons
    document.addEventListener('click', async (e) => {
      const likeBtn = e.target.closest('.like-btn');
      const useBtn = e.target.closest('.use-btn');
      const shareBtn = e.target.closest('.share-btn');
      const copyBtn = e.target.closest('.copy-prompt-btn');
      
      if (likeBtn) {
        await this.handleLike(likeBtn);
      } else if (useBtn) {
        await this.handleUse(useBtn);
      } else if (shareBtn) {
        await this.handleShare(shareBtn);
      } else if (copyBtn) {
        await this.handleCopyPrompt(copyBtn);
      }
    });
  }

  async handleLike(likeBtn) {
    const promptId = likeBtn.dataset.promptId;
    const user = await getCurrentUser();
    if (!user) {
      showNotification('Please login to like prompts', 'error');
      return;
    }

    const likesCount = likeBtn.querySelector('.likes-count');
    const icon = likeBtn.querySelector('i');
    const isLiked = icon.classList.contains('fas');
    
    try {
      const action = isLiked ? 'unlike' : 'like';
      const response = await fetch(`/api/prompt/${promptId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, action })
      });

      if (response.ok) {
        const currentLikes = parseInt(likesCount.textContent) || 0;
        const newLikes = action === 'like' ? currentLikes + 1 : Math.max(0, currentLikes - 1);
        
        likesCount.textContent = this.formatCount(newLikes);
        icon.className = action === 'like' ? 'fas fa-heart' : 'far fa-heart';
        
        // Add animation
        likesCount.classList.add('count-animation');
        setTimeout(() => likesCount.classList.remove('count-animation'), 300);
        
        showNotification(action === 'like' ? 'Prompt liked!' : 'Like removed', 'success');
      }
    } catch (error) {
      console.error('Like error:', error);
      showNotification('Failed to update like', 'error');
    }
  }

  async handleUse(useBtn) {
    const promptId = useBtn.dataset.promptId;
    const user = await getCurrentUser();
    if (!user) {
      showNotification('Please login to mark prompts as used', 'error');
      return;
    }

    const usesCount = useBtn.querySelector('.uses-count');
    
    try {
      const response = await fetch(`/api/prompt/${promptId}/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid })
      });

      if (response.ok) {
        const currentUses = parseInt(usesCount.textContent) || 0;
        usesCount.textContent = this.formatCount(currentUses + 1);
        
        // Add animation
        usesCount.classList.add('count-animation');
        setTimeout(() => usesCount.classList.remove('count-animation'), 300);
        
        showNotification('Prompt marked as used!', 'success');
      }
    } catch (error) {
      console.error('Use error:', error);
      showNotification('Failed to mark as used', 'error');
    }
  }

  async handleShare(shareBtn) {
    const promptId = shareBtn.dataset.promptId;
    const promptUrl = `${window.location.origin}/prompt/${promptId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this AI prompt!',
          text: 'Amazing AI-generated creation on Prompt Seen',
          url: promptUrl
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          await this.copyToClipboard(promptUrl);
          showNotification('Link copied to clipboard!', 'success');
        }
      }
    } else {
      await this.copyToClipboard(promptUrl);
      showNotification('Link copied to clipboard!', 'success');
    }
  }

  async handleCopyPrompt(button) {
    const promptText = button.dataset.promptText;
    await this.copyToClipboard(promptText);
    showNotification('Prompt copied to clipboard!', 'success');
    
    // Add visual feedback
    const originalHTML = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i> Copied!';
    button.style.background = '#20bf6b';
    button.style.color = 'white';
    button.style.borderColor = '#20bf6b';
    
    setTimeout(() => {
      button.innerHTML = originalHTML;
      button.style.background = '';
      button.style.color = '';
      button.style.borderColor = '';
    }, 2000);
  }

  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  }

  async trackPromptView(promptId) {
    try {
      await fetch(`/api/prompt/${promptId}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('View tracking error:', error);
    }
  }

  createLoadingShorts() {
    // Create 4 loading cards for desktop grid
    const loadingCards = Array(4).fill(0).map((_, i) => `
      <div class="shorts-prompt-card loading-prompt" style="opacity: 0; transform: translateY(20px); transition: opacity 0.5s ease ${i * 0.1}s, transform 0.5s ease ${i * 0.1}s">
        <div class="shorts-video-container">
          <div class="loading-placeholder"></div>
        </div>
        <div class="shorts-info">
          <div class="shorts-prompt-text loading-text" style="height: 60px; margin-bottom: 10px;"></div>
          <div class="shorts-meta">
            <span class="loading-text" style="width: 100px; height: 12px; display: inline-block;"></span>
            <span class="loading-text" style="width: 80px; height: 12px; display: inline-block;"></span>
          </div>
          <div class="prompt-actions">
            <div class="loading-text" style="width: 120px; height: 32px; border-radius: 20px;"></div>
            <div class="loading-text" style="width: 60px; height: 12px; margin-left: auto;"></div>
          </div>
        </div>
      </div>
    `).join('');

    return loadingCards;
  }

  showLoadingIndicator() {
    let loader = document.getElementById('infinite-scroll-loader');
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'infinite-scroll-loader';
      loader.className = 'loading-shorts';
      loader.innerHTML = `
        <div class="spinner"></div>
        <span>Loading more prompts...</span>
      `;
      document.getElementById('promptsContainer').appendChild(loader);
    }
  }

  hideLoadingIndicator() {
    const loader = document.getElementById('infinite-scroll-loader');
    if (loader) {
      loader.remove();
    }
  }

  showNoMorePrompts() {
    const promptsContainer = document.getElementById('promptsContainer');
    if (promptsContainer) {
      const endMessage = document.createElement('div');
      endMessage.className = 'loading-shorts';
      endMessage.innerHTML = `
        <i class="fas fa-check-circle" style="color: #20bf6b; margin-right: 8px;"></i>
        <span>You've seen all prompts!</span>
      `;
      promptsContainer.appendChild(endMessage);
    }
  }

  animatePromptsIn() {
    const prompts = document.querySelectorAll('.shorts-prompt-card');
    prompts.forEach(prompt => {
      prompt.style.opacity = '1';
      prompt.style.transform = 'translateY(0)';
    });
  }

  formatCount(count) {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  }

  showErrorState() {
    const promptsContainer = document.getElementById('promptsContainer');
    if (promptsContainer) {
      promptsContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #666;">
          <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.5;"></i>
          <h3>Unable to load prompts</h3>
          <p>Please check your connection and try again</p>
          <button onclick="youtubePrompts.loadInitialPrompts()" class="cta-button" style="margin-top: 20px;">
            <i class="fas fa-redo"></i> Retry
          </button>
        </div>
      `;
    }
  }
}

// YouTube-style Search and Category Functionality
class YouTubeStyleHeader {
  constructor() {
    this.currentCategory = 'all';
    this.searchTimeout = null;
    this.init();
  }

  init() {
    this.setupSearch();
    this.setupCategories();
    this.setupMobileMenu();
  }

  setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const searchSuggestions = document.getElementById('searchSuggestions');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
          this.handleSearch(e.target.value);
        }, 300);
      });

      if (searchButton) {
        searchButton.addEventListener('click', () => {
          this.performSearch(searchInput.value);
        });
      }

      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.performSearch(searchInput.value);
        }
      });

      searchInput.addEventListener('focus', () => {
        this.showRecentSearches();
      });

      document.addEventListener('click', (e) => {
        if (searchSuggestions && !searchInput.contains(e.target) && !searchSuggestions.contains(e.target)) {
          searchSuggestions.style.display = 'none';
        }
      });
    }
  }

  setupCategories() {
    const categoryItems = document.querySelectorAll('.category-item');
    
    categoryItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const category = item.dataset.category;
        this.selectCategory(category);
        
        categoryItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
      });
    });
  }

  setupMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-toggle');
    
    if (mobileToggle) {
      mobileToggle.addEventListener('click', () => {
        document.body.classList.toggle('mobile-menu-open');
      });
    }
  }

  async handleSearch(query) {
    const searchSuggestions = document.getElementById('searchSuggestions');
    
    if (!searchSuggestions) return;
    
    if (!query.trim()) {
      this.showRecentSearches();
      return;
    }

    try {
      searchSuggestions.innerHTML = `
        <div class="suggestion-item">
          <i class="fas fa-spinner fa-spin suggestion-icon"></i>
          <span>Searching...</span>
        </div>
      `;
      searchSuggestions.style.display = 'block';

      const suggestions = await this.getSearchSuggestions(query.toLowerCase());
      this.displaySearchSuggestions(suggestions, query);
      
    } catch (error) {
      console.error('Search error:', error);
      this.showSearchError();
    }
  }

  async getSearchSuggestions(query) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockSuggestions = [
          { text: `${query} `, category: 'art' },
          { text: `${query} `, category: 'photography' },
          { text: `${query} `, category: 'design' },
          { text: `${query} `, category: 'all' }
        ];
        resolve(mockSuggestions);
      }, 200);
    });
  }

  displaySearchSuggestions(suggestions, query) {
    const searchSuggestions = document.getElementById('searchSuggestions');
    if (!searchSuggestions) return;
    
    if (suggestions.length === 0) {
      searchSuggestions.innerHTML = `
        <div class="suggestion-item">
          <i class="fas fa-search suggestion-icon"></i>
          <span>No results for "${query}"</span>
        </div>
      `;
    } else {
      searchSuggestions.innerHTML = suggestions.map(suggestion => `
        <div class="suggestion-item" data-query="${suggestion.text}">
          <i class="fas fa-search suggestion-icon"></i>
          <div class="suggestion-text">${suggestion.text}</div>
          <span class="suggestion-category">${suggestion.category}</span>
        </div>
      `).join('');

      searchSuggestions.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
          const query = item.dataset.query;
          document.getElementById('searchInput').value = query;
          this.performSearch(query);
          searchSuggestions.style.display = 'none';
        });
      });
    }
    
    searchSuggestions.style.display = 'block';
  }

  showRecentSearches() {
    const searchSuggestions = document.getElementById('searchSuggestions');
    if (!searchSuggestions) return;
    
    const recentSearches = this.getRecentSearches();
    
    if (recentSearches.length === 0) {
      searchSuggestions.innerHTML = `
        <div class="suggestion-item">
          <i class="fas fa-clock suggestion-icon"></i>
          <span>No recent searches</span>
        </div>
      `;
    } else {
      searchSuggestions.innerHTML = `
        <div class="suggestion-item" style="font-weight: 600; color: #666;">
          <i class="fas fa-clock suggestion-icon"></i>
          <span>Recent searches</span>
        </div>
        ${recentSearches.map(search => `
          <div class="suggestion-item" data-query="${search}">
            <i class="fas fa-search suggestion-icon"></i>
            <div class="suggestion-text">${search}</div>
          </div>
        `).join('')}
      `;

      searchSuggestions.querySelectorAll('.suggestion-item:not(:first-child)').forEach(item => {
        item.addEventListener('click', () => {
          const query = item.dataset.query;
          document.getElementById('searchInput').value = query;
          this.performSearch(query);
          searchSuggestions.style.display = 'none';
        });
      });
    }
    
    searchSuggestions.style.display = 'block';
  }

  showSearchError() {
    const searchSuggestions = document.getElementById('searchSuggestions');
    if (!searchSuggestions) return;
    
    searchSuggestions.innerHTML = `
      <div class="suggestion-item">
        <i class="fas fa-exclamation-triangle suggestion-icon"></i>
        <span>Search temporarily unavailable</span>
      </div>
    `;
    searchSuggestions.style.display = 'block';
  }

  performSearch(query) {
    if (!query.trim()) return;
    
    // Add search term to categories
    if (window.categoryManager) {
      categoryManager.addSearchCategory(query);
    }
    
    this.addToRecentSearches(query);
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.value = query;
    }
    
    // Show search results using the search manager
    if (window.searchManager) {
      searchManager.currentSearchTerm = query;
      searchManager.showSearchResults();
    }
    
    const searchSuggestions = document.getElementById('searchSuggestions');
    if (searchSuggestions) {
      searchSuggestions.style.display = 'none';
    }
  }

  selectCategory(category) {
    this.currentCategory = category;
    
    if (window.youtubePrompts) {
      // Filter prompts by category
      youtubePrompts.currentPage = 1;
      youtubePrompts.hasMore = true;
      youtubePrompts.loadInitialPrompts();
    }
    
    showNotification(`Showing ${this.getCategoryName(category)} prompts`, 'info');
  }

  getCategoryName(category) {
    const categories = {
      
      'photography': 'Photography',
      
    };
    return categories[category] || category;
  }

  getRecentSearches() {
    return JSON.parse(localStorage.getItem('recentSearches') || '[]');
  }

  addToRecentSearches(query) {
    let recent = this.getRecentSearches();
    recent = recent.filter(item => item !== query);
    recent.unshift(query);
    recent = recent.slice(0, 5);
    localStorage.setItem('recentSearches', JSON.stringify(recent));
  }
}

// Engagement Manager Class
class EngagementManager {
  constructor() {
    this.user = null;
    this.trackedViews = new Set();
  }

  async init() {
    this.user = await getCurrentUser();
    this.setupGlobalListeners();
  }

  setupGlobalListeners() {
    this.setupViewTracking();
  }

  setupViewTracking() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const promptCard = entry.target;
          const promptId = promptCard.dataset.promptId;
          
          if (promptId && !this.trackedViews.has(promptId)) {
            this.trackView(promptId);
            this.trackedViews.add(promptId);
          }
        }
      });
    }, { threshold: 0.5 });

    const observerConfig = {
      childList: true,
      subtree: true
    };

    const domObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && node.classList?.contains('shorts-prompt-card')) {
            observer.observe(node);
          } else if (node.nodeType === 1) {
            node.querySelectorAll?.('.shorts-prompt-card').forEach(card => {
              observer.observe(card);
            });
          }
        });
      });
    });

    domObserver.observe(document.body, observerConfig);
  }

  async trackView(promptId) {
    try {
      await fetch(`/api/prompt/${promptId}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  }
}

// Search Manager Class
class SearchManager {
    constructor() {
        this.currentSearchTerm = '';
        this.currentCategory = 'all';
        this.currentSort = 'recent';
        this.allPrompts = [];
        this.isSearching = false;
    }

    async init() {
        await this.loadAllPrompts();
        this.setupSearchListeners();
    }

    async loadAllPrompts() {
        try {
            const user = await getCurrentUser();
            const userId = user?.uid || null;
            const params = new URLSearchParams({
                page: '1',
                limit: '1000',
                ...(userId && { userId })
            });
            
            const response = await fetch(`/api/uploads?${params}`);
            if (response.ok) {
                const data = await response.json();
                this.allPrompts = data.uploads;
            }
        } catch (error) {
            console.error('Error loading prompts for search:', error);
        }
    }

    setupSearchListeners() {
        const searchInput = document.getElementById('searchInput');
        const searchButton = document.getElementById('searchButton');
        const sortBy = document.getElementById('sortBy');
        const categoryFilter = document.getElementById('categoryFilter');
        const clearSearch = document.getElementById('clearSearch');

        if (searchButton) {
            searchButton.addEventListener('click', () => this.performSearch());
        }

        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
        }

        if (sortBy) {
            sortBy.addEventListener('change', () => {
                this.currentSort = sortBy.value;
                if (this.currentSearchTerm || this.currentCategory !== 'all') {
                    this.performSearch();
                }
            });
        }

        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                this.currentCategory = categoryFilter.value;
                if (this.currentSearchTerm || this.currentCategory !== 'all') {
                    this.performSearch();
                }
            });
        }

        if (clearSearch) {
            clearSearch.addEventListener('click', () => this.clearSearch());
        }
    }

    performSearch() {
        const searchInput = document.getElementById('searchInput');
        const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
        
        this.currentSearchTerm = searchTerm;
        this.showSearchResults();
    }

    showSearchResults() {
        const promptsContainer = document.getElementById('promptsContainer');
        const resultsInfo = document.getElementById('searchResultsInfo');
        const resultsCount = document.getElementById('resultsCount');

        if (!this.currentSearchTerm && this.currentCategory === 'all') {
            this.clearSearch();
            return;
        }

        this.isSearching = true;

        if (promptsContainer) {
            promptsContainer.innerHTML = `
                <div class="search-loading">
                    <i class="fas fa-spinner fa-spin fa-2x"></i>
                    <p>Searching prompts...</p>
                </div>
            `;
        }

        setTimeout(() => {
            const filteredPrompts = this.filterPrompts();
            this.displaySearchResults(filteredPrompts);
            
            if (resultsCount && resultsInfo) {
                resultsCount.textContent = `Found ${filteredPrompts.length} prompts matching your search`;
                resultsInfo.style.display = 'flex';
            }
            
            this.isSearching = false;
        }, 500);
    }

    filterPrompts() {
        let filtered = [...this.allPrompts];

        if (this.currentSearchTerm) {
            const searchTerm = this.currentSearchTerm.toLowerCase();
            filtered = filtered.filter(prompt => {
                const title = prompt.title?.toLowerCase() || '';
                const promptText = prompt.promptText?.toLowerCase() || '';
                const keywords = prompt.keywords?.map(k => k.toLowerCase()) || [];
                
                return title.includes(searchTerm) ||
                       promptText.includes(searchTerm) ||
                       keywords.some(keyword => keyword.includes(searchTerm));
            });
        }

        if (this.currentCategory !== 'all') {
            filtered = filtered.filter(prompt => 
                prompt.category === this.currentCategory
            );
        }

        filtered = this.sortPrompts(filtered);

        return filtered;
    }

    sortPrompts(prompts) {
        switch (this.currentSort) {
            case 'recent':
                return prompts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            case 'popular':
                return prompts.sort((a, b) => (b.likes + b.views) - (a.likes + a.views));
            case 'likes':
                return prompts.sort((a, b) => b.likes - a.likes);
            case 'views':
                return prompts.sort((a, b) => b.views - a.views);
            default:
                return prompts;
        }
    }

    displaySearchResults(prompts) {
        const promptsContainer = document.getElementById('promptsContainer');
        
        if (!promptsContainer) return;
        
        if (prompts.length === 0) {
            promptsContainer.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h3>No prompts found</h3>
                    <p>Try adjusting your search terms or filters</p>
                    <button class="btn-outline" onclick="searchManager.clearSearch()" style="margin-top: 20px;">
                        Show All Prompts
                    </button>
                </div>
            `;
            return;
        }

        promptsContainer.innerHTML = '';
        
        prompts.forEach((prompt, index) => {
            const promptCard = window.youtubePrompts.createShortsPrompt(prompt, index);
            promptCard.style.opacity = '0';
            promptCard.style.transform = 'translateY(20px)';
            promptCard.style.transition = `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`;
            
            promptsContainer.appendChild(promptCard);
            
            setTimeout(() => {
                promptCard.style.opacity = '1';
                promptCard.style.transform = 'translateY(0)';
            }, 100 + (index * 100));
        });
    }

    clearSearch() {
        const searchInput = document.getElementById('searchInput');
        const categoryFilter = document.getElementById('categoryFilter');
        const sortBy = document.getElementById('sortBy');
        const resultsInfo = document.getElementById('searchResultsInfo');
        
        if (searchInput) searchInput.value = '';
        if (categoryFilter) categoryFilter.value = 'all';
        if (sortBy) sortBy.value = 'recent';
        
        this.currentSearchTerm = '';
        this.currentCategory = 'all';
        this.currentSort = 'recent';
        
        if (resultsInfo) resultsInfo.style.display = 'none';
        this.isSearching = false;
        
        // Reload YouTube-style prompts
        if (window.youtubePrompts) {
            youtubePrompts.currentPage = 1;
            youtubePrompts.hasMore = true;
            youtubePrompts.loadInitialPrompts();
        }
    }
}

// Mobile Navigation Functions
function initMobileNavigation() {
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navLinks = document.querySelector('.nav-links');
  
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      mobileToggle.querySelector('i').classList.toggle('fa-bars');
      mobileToggle.querySelector('i').classList.toggle('fa-times');
    });
    
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        mobileToggle.querySelector('i').classList.add('fa-bars');
        mobileToggle.querySelector('i').classList.remove('fa-times');
      });
    });
  }
}

function addMobileNavigation() {
  if (window.innerWidth <= 768) {
    const mobileNav = document.createElement('div');
    mobileNav.className = 'mobile-nav';
    mobileNav.innerHTML = `
      <a href="index.html" class="nav-item active">
        <i class="fas fa-home"></i>
        <span>Home</span>
      </a>
      <a href="news.html" class="nav-item">
        <i class="fas fa-cloud-upload-alt"></i>
        <span>News</span>
      </a>
      <button class="nav-item" id="mobileUploadBtn">
        <i class="fas fa-plus-circle"></i>
        <span>Upload</span>
      </button>
      <a href="chatbot.html" class="nav-item">
        <i class="fas fa-exchange-alt"></i>
        <span>Create</span>
      </a>
      <a href="login.html" class="nav-item">
        <i class="fas fa-user"></i>
        <span>Login</span>
      </a>
    `;
    
    document.body.appendChild(mobileNav);
    
    document.getElementById('mobileUploadBtn').addEventListener('click', () => {
      document.getElementById('openUploadModal').click();
    });
  }
}

// Filter buttons functionality
function initFilterButtons() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const filter = btn.textContent.toLowerCase();
      
      // This will be handled by the YouTubeStylePrompts category filtering
      if (window.youtubePrompts) {
        youtubePrompts.currentPage = 1;
        youtubePrompts.hasMore = true;
        youtubePrompts.loadInitialPrompts();
      }
    });
  });
}

// Scroll effect for header
function initScrollEffects() {
  window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (header) {
      if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.98)';
        header.style.backdropFilter = 'blur(10px)';
        header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.15)';
      } else {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
        header.style.backdropFilter = 'blur(5px)';
        header.style.boxShadow = '0 2px 15px rgba(0, 0, 0, 0.1)';
      }
    }
  });
}

// Upload Modal Functionality
function initUploadModal() {
  const uploadModal = document.getElementById('uploadModal');
  const openUploadBtn = document.getElementById('openUploadModal');
  const closeModalBtn = document.getElementById('closeModal');
  const uploadForm = document.getElementById('uploadForm');
  const imageUpload = document.getElementById('imageUpload');
  const imagePreview = document.getElementById('imagePreview');
  
  if (openUploadBtn && uploadModal) {
    openUploadBtn.addEventListener('click', () => {
      const user = checkAuth();
      if (!user) {
        alert('Please login to upload creations');
        window.location.href = 'login.html?returnUrl=' + encodeURIComponent(window.location.href);
        return;
      }
      
      uploadModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  }
  
  if (closeModalBtn && uploadModal) {
    closeModalBtn.addEventListener('click', () => {
      uploadModal.classList.remove('active');
      document.body.style.overflow = '';
    });
  }
  
  if (uploadModal) {
    uploadModal.addEventListener('click', (e) => {
      if (e.target === uploadModal) {
        uploadModal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }
  
  if (imageUpload && imagePreview) {
    imageUpload.addEventListener('change', function() {
      const file = this.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          imagePreview.src = e.target.result;
          imagePreview.style.display = 'block';
        }
        reader.readAsDataURL(file);
      } else {
        imagePreview.style.display = 'none';
      }
    });
    
    const fileUploadArea = document.querySelector('.file-upload');
    if (fileUploadArea) {
      fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadArea.style.borderColor = '#4e54c8';
        fileUploadArea.style.background = 'rgba(78, 84, 200, 0.05)';
      });
      
      fileUploadArea.addEventListener('dragleave', () => {
        fileUploadArea.style.borderColor = '#ddd';
        fileUploadArea.style.background = '';
      });
      
      fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadArea.style.borderColor = '#ddd';
        fileUploadArea.style.background = '';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          imageUpload.files = files;
          const event = new Event('change', { bubbles: true });
          imageUpload.dispatchEvent(event);
        }
      });
    }
  }
  
  if (uploadForm) {
    uploadForm.addEventListener('submit', handleUploadSubmit);
  }
}

// Handle upload form submission
async function handleUploadSubmit(e) {
  e.preventDefault();
  
  const user = checkAuth();
  if (!user) {
    alert('Please login to upload creations');
    window.location.href = 'login.html?returnUrl=' + encodeURIComponent(window.location.href);
    return;
  }
  
  const title = document.getElementById('promptTitle').value;
  const promptText = document.getElementById('promptText').value;
  const category = document.getElementById('category').value;
  const file = document.getElementById('imageUpload').files[0];
  
  if (!file) {
    alert('Please select an image to upload!');
    return;
  }
  
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    alert('Please upload a JPEG, PNG, or WebP image');
    return;
  }
  
  if (file.size > 5 * 1024 * 1024) {
    alert('File size exceeds 5MB limit. Please choose a smaller image.');
    return;
  }
  
  if (!title || !title.trim()) {
    alert('Please enter a title for your creation');
    return;
  }
  
  if (!promptText || !promptText.trim()) {
    alert('Please enter the prompt text used to generate this image');
    return;
  }
  
  try {
    const submitBtn = document.querySelector('.submit-btn');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    submitBtn.disabled = true;
    
    await initializeFirebase();
    const firebaseUser = await getCurrentUser();
    
    if (!firebaseUser) {
      throw new Error('User not authenticated with Firebase. Please log in again.');
    }
    
    const idToken = await firebaseUser.getIdToken();
    
    const formData = new FormData();
    formData.append('image', file);
    formData.append('title', title);
    formData.append('promptText', promptText);
    if (category) formData.append('category', category);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`
      },
      body: formData
    });
    
    if (!response.ok) {
      let errorMsg = `Upload failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.error || errorMsg;
      } catch (e) {
        console.error('Error parsing error response:', e);
      }
      throw new Error(errorMsg);
    }
    
    const result = await response.json();
    
    if (result.success) {
      const uploadModal = document.getElementById('uploadModal');
      const uploadForm = document.getElementById('uploadForm');
      const imagePreview = document.getElementById('imagePreview');
      
      uploadModal.classList.remove('active');
      document.body.style.overflow = '';
      uploadForm.reset();
      imagePreview.style.display = 'none';
      
      showNotification('Upload successful! Your creation is now visible in the showcase.', 'success');
      
      // Refresh the prompts to show the new upload
      if (window.youtubePrompts) {
        youtubePrompts.currentPage = 1;
        youtubePrompts.hasMore = true;
        youtubePrompts.loadInitialPrompts();
      }
    } else {
      throw new Error(result.error || 'Upload failed');
    }
  } catch (error) {
    console.error('Upload error:', error);
    
    let userMessage;
    if (error.message.includes('bucket') || error.message.includes('Storage')) {
      userMessage = 'Storage service unavailable. Please try again later.';
    } else if (error.message.includes('permission') || error.message.includes('credentials')) {
      userMessage = 'Permission error. Please log out and log in again.';
    } else if (error.message.includes('size')) {
      userMessage = 'File too large. Please select an image under 5MB.';
    } else {
      userMessage = 'Could not save your image. Please try a different file.';
    }
    
    showNotification(`Upload failed: ${userMessage}`, 'error');
  } finally {
    const submitBtn = document.querySelector('.submit-btn');
    if (submitBtn) {
      submitBtn.innerHTML = '<i class="fas fa-upload"></i> Upload with SEO Optimization';
      submitBtn.disabled = false;
    }
  }
}

// Show notification
function showNotification(message, type = 'info') {
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
      <span>${message}</span>
      <button class="notification-close"><i class="fas fa-times"></i></button>
    </div>
  `;
  
  if (!document.querySelector('#notification-styles')) {
    const styles = document.createElement('style');
    styles.id = 'notification-styles';
    styles.textContent = `
      .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        max-width: 400px;
        animation: slideIn 0.3s ease;
      }
      .notification-success { border-left: 4px solid #20bf6b; }
      .notification-error { border-left: 4px solid #ff6b6b; }
      .notification-info { border-left: 4px solid #4e54c8; }
      .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .notification-close {
        background: none;
        border: none;
        cursor: pointer;
        color: #777;
        margin-left: auto;
      }
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(styles);
  }
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }
  }, 5000);
  
  notification.querySelector('.notification-close').addEventListener('click', () => {
    notification.remove();
  });
}

// Quick Fix for Case-Insensitive Search
function setupCaseInsensitiveSearch() {
  const searchInput = document.getElementById('searchInput');
  
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      // Search logic handles case-insensitive matching
    });
  }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Initializing Prompt Seen...');
  
  await initializeFirebase();
  showAuthElements();
  
  // Initialize all components
  initMobileNavigation();
  initFilterButtons();
  initScrollEffects();
  initUploadModal();
  initNewsUploadModal();
  
  // Initialize YouTube-style prompts with infinite scroll
  window.youtubePrompts = new YouTubeStylePrompts();
  
  // Initialize category manager
  window.categoryManager = new CategoryManager();
  
  // Initialize engagement manager
  const engagementManager = new EngagementManager();
  await engagementManager.init();
  
  // Initialize search functionality
  window.searchManager = new SearchManager();
  await searchManager.init();
  
  // Initialize news functionality
  window.newsManager = new NewsManager();
  
  // Load news if news container exists
  if (document.getElementById('newsContainer')) {
    newsManager.loadNews();
  }
  
  // Initialize YouTube-style header
  const youTubeHeader = new YouTubeStyleHeader();
  
  // Setup case-insensitive search
  setupCaseInsensitiveSearch();
  
  // Add mobile bottom navigation
  addMobileNavigation();
  
  // Add structured data for homepage
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Prompt Seen",
    "url": "https://promptseen.co",
    "description": "AI Prompt Engineering Platform - Create, share and discover effective AI prompts",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://promptseen.co/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };
  
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(structuredData);
  document.head.appendChild(script);
  
  console.log('Prompt Seen initialization complete');
});

// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function() {
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navLinks = document.querySelector('.nav-links');
    const mobileOverlay = document.createElement('div');
    
    mobileOverlay.className = 'mobile-overlay';
    document.body.appendChild(mobileOverlay);
    
    mobileToggle.addEventListener('click', function() {
        navLinks.classList.toggle('active');
        mobileOverlay.classList.toggle('active');
        document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
    });
    
    mobileOverlay.addEventListener('click', function() {
        navLinks.classList.remove('active');
        mobileOverlay.classList.remove('active');
        document.body.style.overflow = '';
    });
    
    const navLinksItems = document.querySelectorAll('.nav-links a');
    navLinksItems.forEach(link => {
        link.addEventListener('click', function() {
            navLinks.classList.remove('active');
            mobileOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
    
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            navLinks.classList.remove('active');
            mobileOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
});

// Make functions available globally
window.loadUploads = () => {
  if (window.youtubePrompts) {
    youtubePrompts.currentPage = 1;
    youtubePrompts.hasMore = true;
    youtubePrompts.loadInitialPrompts();
  }
};

window.searchManager = window.searchManager || {};
window.newsManager = window.newsManager || {};
window.categoryManager = window.categoryManager || {};