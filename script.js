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
      // Real-time search with debouncing
      searchInput.addEventListener('input', (e) => {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
          this.handleSearch(e.target.value);
        }, 300);
      });

      // Search on button click
      if (searchButton) {
        searchButton.addEventListener('click', () => {
          this.performSearch(searchInput.value);
        });
      }

      // Search on Enter key
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.performSearch(searchInput.value);
        }
      });

      // Show suggestions on focus
      searchInput.addEventListener('focus', () => {
        this.showRecentSearches();
      });

      // Hide suggestions when clicking outside
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
        
        // Update active state
        categoryItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
      });
    });
  }

  setupMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-toggle');
    
    if (mobileToggle) {
      mobileToggle.addEventListener('click', () => {
        // Toggle mobile menu (you can expand this)
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
      // Show loading state
      searchSuggestions.innerHTML = `
        <div class="suggestion-item">
          <i class="fas fa-spinner fa-spin suggestion-icon"></i>
          <span>Searching...</span>
        </div>
      `;
      searchSuggestions.style.display = 'block';

      // Simulate API call - replace with actual search
      const suggestions = await this.getSearchSuggestions(query.toLowerCase());
      this.displaySearchSuggestions(suggestions, query);
      
    } catch (error) {
      console.error('Search error:', error);
      this.showSearchError();
    }
  }

  async getSearchSuggestions(query) {
    // Simulate API call - replace with your actual search endpoint
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

      // Add click handlers to suggestions
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

      // Add click handlers
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
    
    // Add to recent searches
    this.addToRecentSearches(query);
    
    // Use the existing search manager
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.value = query;
    }
    
    if (window.searchManager) {
      searchManager.currentSearchTerm = query;
      searchManager.showSearchResults();
    }
    
    // Hide suggestions
    const searchSuggestions = document.getElementById('searchSuggestions');
    if (searchSuggestions) {
      searchSuggestions.style.display = 'none';
    }
  }

  selectCategory(category) {
    this.currentCategory = category;
    
    // Update the search manager
    if (window.searchManager) {
      searchManager.currentCategory = category;
      
      if (category === 'trending') {
        // Show trending content
        searchManager.currentSort = 'popular';
      } else {
        searchManager.currentSort = 'recent';
      }
      
      // Refresh the display
      if (searchManager.currentSearchTerm || category !== 'all') {
        searchManager.showSearchResults();
      } else {
        loadUploads(1);
      }
    }
    
    // Show notification
    showNotification(`Showing ${this.getCategoryName(category)} prompts`, 'info');
  }

  getCategoryName(category) {
    const categories = {
      'all': 'All',
      'art': 'AI Art',
      'photography': 'Photography',
      'design': 'Design',
      'writing': 'Writing',
      'trending': 'Trending'
    };
    return categories[category] || category;
  }

  // Recent searches management
  getRecentSearches() {
    return JSON.parse(localStorage.getItem('recentSearches') || '[]');
  }

  addToRecentSearches(query) {
    let recent = this.getRecentSearches();
    recent = recent.filter(item => item !== query);
    recent.unshift(query);
    recent = recent.slice(0, 5); // Keep only 5 most recent
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
    // Track prompt visibility for view counting
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

    // Observe prompt cards as they're added to DOM
    const observerConfig = {
      childList: true,
      subtree: true
    };

    const domObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && node.classList?.contains('prompt-card')) {
            observer.observe(node);
          } else if (node.nodeType === 1) {
            node.querySelectorAll?.('.prompt-card').forEach(card => {
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
      
      // Update the view count in the UI
      this.updatePromptCount(promptId, 'views', 1);
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  }

  async toggleLike(promptId, currentLikes, isCurrentlyLiked) {
    try {
      const action = isCurrentlyLiked ? 'unlike' : 'like';
      const userId = this.user?.uid || 'anonymous';
      
      const response = await fetch(`/api/prompt/${promptId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, action })
      });

      if (response.ok) {
        const result = await response.json();
        const likeChange = action === 'like' ? 1 : -1;
        
        // Update UI immediately
        this.updatePromptCount(promptId, 'likes', likeChange);
        this.updateLikeButton(promptId, !isCurrentlyLiked);
        
        return true;
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      showNotification('Failed to update like. Please try again.', 'error');
    }
    return false;
  }

  async trackUse(promptId) {
    try {
      const userId = this.user?.uid || 'anonymous';
      
      const response = await fetch(`/api/prompt/${promptId}/use`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        // Update UI immediately
        this.updatePromptCount(promptId, 'uses', 1);
        showNotification('Prompt marked as used!', 'success');
        return true;
      }
    } catch (error) {
      console.error('Error tracking use:', error);
      showNotification('Failed to mark as used. Please try again.', 'error');
    }
    return false;
  }

  updatePromptCount(promptId, type, change) {
    // Update in prompt cards
    const promptCards = document.querySelectorAll(`[data-prompt-id="${promptId}"]`);
    promptCards.forEach(card => {
      const counterElement = card.querySelector(`.${type}-count`);
      if (counterElement) {
        const currentCount = parseInt(counterElement.textContent) || 0;
        const newCount = Math.max(0, currentCount + change);
        counterElement.textContent = newCount;
        
        // Add animation
        counterElement.style.transform = 'scale(1.2)';
        setTimeout(() => {
          counterElement.style.transform = 'scale(1)';
        }, 300);
      }
    });

    // Update in individual prompt pages
    const metaItems = document.querySelectorAll(`.meta-item[data-type="${type}"]`);
    metaItems.forEach(item => {
      const counterElement = item.querySelector('span');
      if (counterElement && counterElement.classList.contains(`${type}-count`)) {
        const currentCount = parseInt(counterElement.textContent) || 0;
        const newCount = Math.max(0, currentCount + change);
        counterElement.textContent = newCount;
      }
    });
  }

  updateLikeButton(promptId, isLiked) {
    const likeButtons = document.querySelectorAll(`[data-prompt-id="${promptId}"] .like-btn`);
    likeButtons.forEach(button => {
      if (isLiked) {
        button.classList.add('liked');
        button.innerHTML = '<i class="fas fa-heart"></i> Liked';
      } else {
        button.classList.remove('liked');
        button.innerHTML = '<i class="far fa-heart"></i> Like';
      }
    });
  }

  createEngagementButtons(prompt, promptUrl) {
    const isLiked = prompt.userLiked || false;
    
    return `
      <div class="engagement-buttons">
        <button class="engagement-btn like-btn ${isLiked ? 'liked' : ''}" 
                data-prompt-id="${prompt.id}">
          <i class="${isLiked ? 'fas' : 'far'} fa-heart"></i>
          <span class="likes-count">${prompt.likes || 0}</span>
        </button>
        
        <button class="engagement-btn use-btn" 
                data-prompt-id="${prompt.id}"
                title="Mark as used">
          <i class="fas fa-download"></i>
          <span class="uses-count">${prompt.uses || 0}</span>
        </button>
        
        <button class="engagement-btn share-btn" 
                data-prompt-url="${promptUrl}"
                title="Share prompt">
          <i class="fas fa-share"></i>
        </button>
        
        <a href="${promptUrl}" class="engagement-btn view-btn" target="_blank" title="View details">
          <i class="fas fa-expand"></i>
          <span class="views-count">${prompt.views || 0}</span>
        </a>
      </div>
    `;
  }
}

// Initialize engagement manager
const engagementManager = new EngagementManager();

// SEO Tracking and Optimization
class SEOTracker {
  static trackUserEngagement(promptId) {
    if (!promptId) return;
    
    let startTime = Date.now();
    let maxScroll = 0;
    
    // Track time spent
    window.addEventListener('beforeunload', () => {
      const timeSpent = Date.now() - startTime;
      if (timeSpent > 3000) {
        this.sendEngagementData(promptId, 'time_spent', timeSpent);
      }
    });
    
    // Track scroll depth
    window.addEventListener('scroll', () => {
      const scrollDepth = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      maxScroll = Math.max(maxScroll, scrollDepth);
    });
    
    window.addEventListener('beforeunload', () => {
      if (maxScroll > 25) {
        this.sendEngagementData(promptId, 'scroll_depth', maxScroll);
      }
    });
  }
  
  static async sendEngagementData(promptId, type, value, platform = null) {
    try {
      const data = { promptId, type, value };
      if (platform) data.platform = platform;
      
      const response = await fetch('/api/track-engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error tracking engagement:', error);
    }
  }
}

// Enhanced prompt card creation with engagement features
function createPromptCard(prompt) {
  const promptCard = document.createElement('div');
  promptCard.className = 'prompt-card';
  promptCard.id = `prompt-${prompt.id}`;
  promptCard.setAttribute('data-prompt-id', prompt.id);
  
  // Add schema.org microdata
  promptCard.setAttribute('itemscope', '');
  promptCard.setAttribute('itemtype', 'https://schema.org/CreativeWork');
  
  const promptUrl = prompt.promptUrl || `https://home.promptseen.co/prompt/${prompt.id}`;
  const imageUrl = prompt.imageUrl || 'https://via.placeholder.com/350x550/4e54c8/white?text=Prompt+Seen';
  
  promptCard.innerHTML = `
    <div class="prompt-image" style="background-image: url('${imageUrl}')" 
         itemprop="image" itemscope itemtype="https://schema.org/ImageObject">
      <meta itemprop="url" content="${imageUrl}">
      <meta itemprop="width" content="800">
      <meta itemprop="height" content="600">
      ${prompt.likes > 1000 ? `<div class="viral-badge">
        <i class="fas fa-fire"></i> Viral
      </div>` : ''}
      ${prompt.likes < 100 ? `<div class="viral-badge" style="background: #20bf6b">
        <i class="fas fa-user"></i> Prompt Seen
      </div>` : ''}
    </div>
    <div class="prompt-content" itemprop="mainEntityOfPage" itemscope itemtype="https://schema.org/WebPage">
      <link itemprop="url" href="${promptUrl}">
      <div class="prompt-meta">
        <span><i class="fas fa-eye"></i> <span class="views-count">${prompt.views || 0}</span> Views</span>
        <span><i class="fas fa-download"></i> <span class="uses-count">${prompt.uses || 0}</span> Uses</span>
      </div>
      <h3 class="prompt-title" itemprop="headline">${prompt.title || 'Untitled Prompt'}</h3>
      <div class="prompt-text" itemprop="description">
        ${prompt.promptText ? (prompt.promptText.length > 200 ? prompt.promptText.substring(0, 200) + '...' : prompt.promptText) : 'No prompt text available.'}
      </div>
      <div class="prompt-analysis">
        <h4>Why this prompt works:</h4>
        <p>This prompt demonstrates effective AI prompt engineering techniques with ${prompt.keywords ? prompt.keywords.slice(0, 3).join(', ') : 'optimal'} parameters for best results.</p>
      </div>
      
      <!-- Engagement Buttons -->
      ${engagementManager.createEngagementButtons(prompt, promptUrl)}
      
      <div class="seo-meta" style="display: none;">
        <meta itemprop="datePublished" content="${prompt.createdAt || new Date().toISOString()}">
        <meta itemprop="dateModified" content="${prompt.updatedAt || prompt.createdAt || new Date().toISOString()}">
        <meta itemprop="author" content="${prompt.userName || 'Prompt Seen Community'}">
        <div itemprop="publisher" itemscope itemtype="https://schema.org/Organization">
          <meta itemprop="name" content="Prompt Seen">
        </div>
      </div>
    </div>
  `;
  
  // Add engagement event listeners
  setTimeout(() => {
    setupEngagementEventListeners(promptCard, prompt);
  }, 100);
  
  // Track engagement for this prompt
  SEOTracker.trackUserEngagement(prompt.id);
  
  return promptCard;
}

// Setup engagement event listeners
function setupEngagementEventListeners(promptCard, prompt) {
  // Like button
  const likeBtn = promptCard.querySelector('.like-btn');
  if (likeBtn) {
    likeBtn.addEventListener('click', async () => {
      const user = await getCurrentUser();
      if (!user) {
        showNotification('Please login to like prompts', 'error');
        return;
      }
      
      const isCurrentlyLiked = likeBtn.classList.contains('liked');
      const currentLikes = parseInt(promptCard.querySelector('.likes-count').textContent) || 0;
      
      await engagementManager.toggleLike(prompt.id, currentLikes, isCurrentlyLiked);
    });
  }
  
  // Use button
  const useBtn = promptCard.querySelector('.use-btn');
  if (useBtn) {
    useBtn.addEventListener('click', async () => {
      const user = await getCurrentUser();
      if (!user) {
        showNotification('Please login to mark prompts as used', 'error');
        return;
      }
      
      await engagementManager.trackUse(prompt.id);
    });
  }
  
  // Share button
  const shareBtn = promptCard.querySelector('.share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const promptUrl = shareBtn.dataset.promptUrl;
      sharePrompt(prompt, promptUrl);
    });
  }
}

// Share prompt function
function sharePrompt(prompt, promptUrl) {
  if (navigator.share) {
    // Web Share API
    navigator.share({
      title: prompt.title,
      text: prompt.promptText?.substring(0, 100) + '...',
      url: promptUrl,
    })
    .then(() => console.log('Successful share'))
    .catch((error) => console.log('Error sharing:', error));
  } else {
    // Fallback to copy to clipboard
    const shareText = `${prompt.title}\n\n${prompt.promptText?.substring(0, 200)}...\n\nView more: ${promptUrl}`;
    
    navigator.clipboard.writeText(shareText).then(() => {
      showNotification('Prompt copied to clipboard!', 'success');
    }).catch(() => {
      // Fallback to old method
      const textArea = document.createElement('textarea');
      textArea.value = shareText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showNotification('Prompt copied to clipboard!', 'success');
    });
  }
}

// Search functionality
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

        // Search on button click
        if (searchButton) {
            searchButton.addEventListener('click', () => this.performSearch());
        }

        // Search on Enter key
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
        }

        // Filter and sort changes
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

        // Clear search
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

        // Show loading state
        if (promptsContainer) {
            promptsContainer.innerHTML = `
                <div class="search-loading">
                    <i class="fas fa-spinner fa-spin fa-2x"></i>
                    <p>Searching prompts...</p>
                </div>
            `;
        }

        // Simulate search delay for better UX
        setTimeout(() => {
            const filteredPrompts = this.filterPrompts();
            this.displaySearchResults(filteredPrompts);
            
            // Update results info
            if (resultsCount && resultsInfo) {
                resultsCount.textContent = `Found ${filteredPrompts.length} prompts matching your search`;
                resultsInfo.style.display = 'flex';
            }
            
            this.isSearching = false;
        }, 500);
    }

    filterPrompts() {
        let filtered = [...this.allPrompts];

        // Filter by search term (case-insensitive)
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

        // Filter by category
        if (this.currentCategory !== 'all') {
            filtered = filtered.filter(prompt => 
                prompt.category === this.currentCategory
            );
        }

        // Sort results
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
            const promptCard = createPromptCard(prompt);
            
            // Add animation
            promptCard.style.opacity = '0';
            promptCard.style.transform = 'translateY(20px)';
            promptCard.style.transition = `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`;
            
            promptsContainer.appendChild(promptCard);
            
            // Animate in
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
        
        // Reload default prompts
        loadUploads(1);
    }
}

// Initialize search manager
const searchManager = new SearchManager();

// Mobile Navigation Toggle
function initMobileNavigation() {
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navLinks = document.querySelector('.nav-links');
  
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      mobileToggle.querySelector('i').classList.toggle('fa-bars');
      mobileToggle.querySelector('i').classList.toggle('fa-times');
    });
    
    // Close mobile menu when clicking on a link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        mobileToggle.querySelector('i').classList.add('fa-bars');
        mobileToggle.querySelector('i').classList.remove('fa-times');
      });
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
      
      // Simple filtering based on button text
      const filter = btn.textContent.toLowerCase();
      const cards = document.querySelectorAll('.prompt-card');
      
      cards.forEach(card => {
        if (filter === 'all') {
          card.style.display = 'block';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 50);
        } else {
          const title = card.querySelector('.prompt-title').textContent.toLowerCase();
          const text = card.querySelector('.prompt-text').textContent.toLowerCase();
          if (title.includes(filter) || text.includes(filter)) {
            card.style.display = 'block';
            setTimeout(() => {
              card.style.opacity = '1';
              card.style.transform = 'translateY(0)';
            }, 50);
          } else {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
              card.style.display = 'none';
            }, 300);
          }
        }
      });
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
    
    // Drag and drop functionality
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
      const promptsContainer = document.getElementById('promptsContainer');
      if (promptsContainer) {
        addPromptToShowcase(result.upload);
      }
      
      const uploadModal = document.getElementById('uploadModal');
      const uploadForm = document.getElementById('uploadForm');
      const imagePreview = document.getElementById('imagePreview');
      
      uploadModal.classList.remove('active');
      document.body.style.overflow = '';
      uploadForm.reset();
      imagePreview.style.display = 'none';
      
      // Show success message
      showNotification('Upload successful! Your creation is now visible in the showcase.', 'success');
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
  // Remove existing notification
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
  
  // Add styles if not already added
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
    `;
    document.head.appendChild(styles);
  }
  
  document.body.appendChild(notification);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }
  }, 5000);
  
  // Close button
  notification.querySelector('.notification-close').addEventListener('click', () => {
    notification.remove();
  });
}

function addPromptToShowcase(prompt) {
  const promptCard = createPromptCard(prompt);
  const promptsContainer = document.getElementById('promptsContainer');
  
  if (promptsContainer) {
    // Add animation
    promptCard.style.opacity = '0';
    promptCard.style.transform = 'translateY(20px)';
    promptCard.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    
    promptsContainer.prepend(promptCard);
    
    // Animate in
    setTimeout(() => {
      promptCard.style.opacity = '1';
      promptCard.style.transform = 'translateY(0)';
    }, 50);
  }
}

// Load uploads from server with pagination
async function loadUploads(page = 1) {
  const promptsContainer = document.getElementById('promptsContainer');
  
  try {
    if (promptsContainer) {
      promptsContainer.innerHTML = `
        <div class="loading" style="text-align: center; padding: 60px; color: #666;">
          <i class="fas fa-spinner fa-spin fa-2x" style="margin-bottom: 20px;"></i>
          <p>Loading AI creations...</p>
        </div>
      `;
    }
    
    const user = await getCurrentUser();
    const userId = user?.uid || null;
    const params = new URLSearchParams({
      page: page.toString(),
      ...(userId && { userId })
    });
    
    const response = await fetch(`/api/uploads?${params}`);
    
    if (!response.ok) {
      throw new Error(`Failed to load uploads: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (promptsContainer) {
      promptsContainer.innerHTML = '';
      
      if (data.uploads.length === 0) {
        promptsContainer.innerHTML = `
          <div class="no-content" style="text-align: center; padding: 60px; color: #666;">
            <i class="fas fa-image fa-3x" style="margin-bottom: 20px; opacity: 0.5;"></i>
            <h3>No creations yet</h3>
            <p>Be the first to upload your AI creation!</p>
            <button class="cta-button" id="firstUploadBtn" style="margin-top: 20px;">
              <i class="fas fa-cloud-upload-alt"></i> Upload Your First Creation
            </button>
          </div>
        `;
        
        document.getElementById('firstUploadBtn').addEventListener('click', () => {
          const uploadBtn = document.getElementById('openUploadModal');
          if (uploadBtn) uploadBtn.click();
        });
        
        return;
      }
      
      data.uploads.forEach((upload, index) => {
        const promptCard = createPromptCard(upload);
        
        // Add staggered animation
        promptCard.style.opacity = '0';
        promptCard.style.transform = 'translateY(20px)';
        promptCard.style.transition = `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`;
        
        promptsContainer.appendChild(promptCard);
        
        // Animate in
        setTimeout(() => {
          promptCard.style.opacity = '1';
          promptCard.style.transform = 'translateY(0)';
        }, 100 + (index * 100));
      });
    }
    
    updatePagination(data.currentPage, data.totalPages);
  } catch (error) {
    console.error('Error loading uploads:', error);
    if (promptsContainer) {
      promptsContainer.innerHTML = `
        <div class="error" style="text-align: center; padding: 60px; color: #ff6b6b;">
          <i class="fas fa-exclamation-triangle fa-2x" style="margin-bottom: 20px;"></i>
          <h3>Error loading content</h3>
          <p>Please try again later</p>
          <button class="btn-outline" onclick="loadUploads(1)" style="margin-top: 20px;">
            <i class="fas fa-redo"></i> Retry
          </button>
        </div>
      `;
    }
  }
}

function updatePagination(currentPage, totalPages) {
  const pagination = document.getElementById('pagination');
  if (!pagination || totalPages <= 1) return;
  
  pagination.innerHTML = '';
  
  // Previous button
  if (currentPage > 1) {
    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i> Prev';
    prevBtn.addEventListener('click', () => loadUploads(currentPage - 1));
    pagination.appendChild(prevBtn);
  }
  
  // Page numbers
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, startPage + 4);
  
  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.className = `pagination-btn ${i === currentPage ? 'active' : ''}`;
    pageBtn.textContent = i;
    pageBtn.addEventListener('click', () => {
      if (i !== currentPage) loadUploads(i);
    });
    pagination.appendChild(pageBtn);
  }
  
  // Next button
  if (currentPage < totalPages) {
    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn';
    nextBtn.innerHTML = 'Next <i class="fas fa-chevron-right"></i>';
    nextBtn.addEventListener('click', () => loadUploads(currentPage + 1));
    pagination.appendChild(nextBtn);
  }
}

// Quick Fix for Case-Insensitive Search
function setupCaseInsensitiveSearch() {
  const searchInput = document.getElementById('searchInput');
  
  if (searchInput) {
    // Normalize input for search while preserving display
    searchInput.addEventListener('input', function(e) {
      // The search logic now handles case-insensitive matching
      // No need to modify the input value for display
    });
  }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  await initializeFirebase();
  showAuthElements();
  
  // Initialize all components
  initMobileNavigation();
  initFilterButtons();
  initScrollEffects();
  initUploadModal();
  
  // Initialize engagement manager
  await engagementManager.init();
  
  // Initialize search functionality
  await searchManager.init();
  
  // Initialize YouTube-style header
  const youTubeHeader = new YouTubeStyleHeader();
  
  // Setup case-insensitive search
  setupCaseInsensitiveSearch();
  
  // Load uploads if on showcase page
  if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
    await loadUploads(1);
  }
  
  // Add structured data for homepage
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Prompt Seen",
    "url": "https://home.promptseen.co",
    "description": "AI Prompt Engineering Platform - Create, share and discover effective AI prompts",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://home.promptseen.co/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };
  
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(structuredData);
  document.head.appendChild(script);
  
  // Add CSS for animations and engagement buttons
  const animationStyles = document.createElement('style');
  animationStyles.textContent = `
    .prompt-card {
      transition: opacity 0.5s ease, transform 0.5s ease;
    }
    
    .engagement-buttons {
      display: flex;
      gap: 10px;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #f0f0f0;
    }
    
    .engagement-btn {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 20px;
      background: white;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 0.9rem;
      text-decoration: none;
      color: inherit;
    }
    
    .engagement-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .like-btn.liked {
      background: #ff6b6b;
      color: white;
      border-color: #ff6b6b;
    }
    
    .use-btn:hover {
      background: #20bf6b;
      color: white;
      border-color: #20bf6b;
    }
    
    .share-btn:hover {
      background: #4e54c8;
      color: white;
      border-color: #4e54c8;
    }
    
    .view-btn:hover {
      background: #8f94fb;
      color: white;
      border-color: #8f94fb;
    }
    
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
    
    .count-animation {
      animation: countPop 0.3s ease;
    }
    
    @keyframes countPop {
      0% { transform: scale(1); }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }
  `;
  document.head.appendChild(animationStyles);
});

// Make functions available globally for onclick handlers
window.loadUploads = loadUploads;
window.searchManager = searchManager;

// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function() {
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navLinks = document.querySelector('.nav-links');
    const mobileOverlay = document.createElement('div');
    
    // Create mobile overlay
    mobileOverlay.className = 'mobile-overlay';
    document.body.appendChild(mobileOverlay);
    
    // Toggle mobile navigation
    mobileToggle.addEventListener('click', function() {
        navLinks.classList.toggle('active');
        mobileOverlay.classList.toggle('active');
        document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
    });
    
    // Close mobile navigation when clicking overlay
    mobileOverlay.addEventListener('click', function() {
        navLinks.classList.remove('active');
        mobileOverlay.classList.remove('active');
        document.body.style.overflow = '';
    });
    
    // Close mobile navigation when clicking a link
    const navLinksItems = document.querySelectorAll('.nav-links a');
    navLinksItems.forEach(link => {
        link.addEventListener('click', function() {
            navLinks.classList.remove('active');
            mobileOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            navLinks.classList.remove('active');
            mobileOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
});