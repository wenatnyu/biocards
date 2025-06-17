// 全局变量
let currentMode = 'chapter';
let currentChapter = null;
let currentIndex = 0;
let flashcards = [];
let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');

// 词汇数据
const vocabData = {
    "Chapter 1: Cell Structure": [
        {
            "word": "Cell",
            "zh": "\u7EC6\u80DE", // 细胞
            "definition": "The basic structural and functional unit of all living organisms"
        },
        {
            "word": "Nucleus",
            "zh": "\u7EC6\u80DE\u6838", // 细胞核
            "definition": "The central organelle that contains the cell's genetic material"
        },
        {
            "word": "Cytoplasm",
            "zh": "\u7EC6\u80DE\u8D28", // 细胞质
            "definition": "The gel-like substance that fills the cell and contains organelles"
        }
    ],
    "Chapter 2: Cell Membrane": [
        {
            "word": "Cell Membrane",
            "zh": "\u7EC6\u80DE\u819C", // 细胞膜
            "definition": "The semi-permeable membrane that surrounds the cell"
        },
        {
            "word": "Phospholipid",
            "zh": "\u78F7\u8102", // 磷脂
            "definition": "The main component of cell membranes"
        },
        {
            "word": "Diffusion",
            "zh": "\u6269\u6563", // 扩散
            "definition": "The movement of molecules from high to low concentration"
        }
    ],
    "Chapter 3: Cell Division": [
        {
            "word": "Mitosis",
            "zh": "\u6709\u4E1D\u5206\u88C2", // 有丝分裂
            "definition": "The process of cell division that results in two identical daughter cells"
        },
        {
            "word": "Meiosis",
            "zh": "\u51CF\u6570\u5206\u88C2", // 减数分裂
            "definition": "The process of cell division that results in four genetically different cells"
        },
        {
            "word": "Chromosome",
            "zh": "\u67D3\u8272\u4F53", // 染色体
            "definition": "Thread-like structures that contain genetic information"
        }
    ]
};

// DOM元素
const homePage = document.getElementById('home-page');
const flashcardPage = document.getElementById('flashcard-page');
const chapterGrid = document.getElementById('chapter-grid');
const flashcardContainer = document.getElementById('flashcard-container');
const searchInput = document.getElementById('search-input');
const progressBar = document.getElementById('progress-bar');
const toast = document.getElementById('toast');

// 按钮元素
const chapterModeBtn = document.getElementById('chapter-mode-btn');
const randomModeBtn = document.getElementById('random-mode-btn');
const favoritesBtn = document.getElementById('favorites-btn');
const backBtn = document.getElementById('back-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

// 初始化
function init() {
    try {
        window.vocabData = vocabData;
        
        // 初始化事件监听
        initEventListeners();
        
        // 显示章节列表
        showChapterList();
    } catch (error) {
        console.error('Error initializing application:', error);
        showToast('Error initializing application. Please try again later.');
    }
}

// 初始化事件监听
function initEventListeners() {
    // 模式选择按钮
    chapterModeBtn.addEventListener('click', () => showChapterList());
    randomModeBtn.addEventListener('click', () => loadRandomMode());
    favoritesBtn.addEventListener('click', () => loadFavoriteMode());
    
    // 导航按钮
    backBtn.addEventListener('click', goHome);
    prevBtn.addEventListener('click', showPreviousCard);
    nextBtn.addEventListener('click', showNextCard);
    
    // 搜索功能
    searchInput.addEventListener('input', debounce(searchTerms, 300));
}

// 显示章节列表
function showChapterList() {
    chapterGrid.innerHTML = '';
    
    Object.entries(window.vocabData).forEach(([chapter, terms]) => {
        const chapterCard = document.createElement('div');
        chapterCard.className = 'chapter-card';
        chapterCard.innerHTML = `
            <h3>${chapter}</h3>
            <p>${terms.length} terms</p>
        `;
        chapterCard.addEventListener('click', () => loadChapter(chapter));
        chapterGrid.appendChild(chapterCard);
    });
}

// 加载章节
function loadChapter(chapter) {
    currentMode = 'chapter';
    currentChapter = chapter;
    currentIndex = 0;
    flashcards = window.vocabData[chapter];
    
    showFlashcardPage();
    updateProgress();
}

// 加载随机模式
function loadRandomMode() {
    currentMode = 'random';
    currentChapter = null;
    currentIndex = 0;
    
    // 合并所有章节的词汇
    flashcards = Object.values(window.vocabData).flat();
    // 随机打乱顺序
    flashcards = shuffleArray(flashcards);
    
    showFlashcardPage();
    updateProgress();
}

// 加载收藏模式
function loadFavoriteMode() {
    currentMode = 'favorites';
    currentChapter = null;
    currentIndex = 0;
    
    // 从所有词汇中筛选出收藏的词汇
    flashcards = Object.values(window.vocabData)
        .flat()
        .filter(term => favorites.includes(term.word));
    
    if (flashcards.length === 0) {
        showToast('No favorite terms yet. Add some favorites to see them here!');
        return;
    }
    
    showFlashcardPage();
    updateProgress();
}

// 显示闪卡页面
function showFlashcardPage() {
    homePage.classList.add('hidden');
    flashcardPage.classList.remove('hidden');
    renderCurrentCard();
}

// 返回首页
function goHome() {
    flashcardPage.classList.add('hidden');
    homePage.classList.remove('hidden');
    searchInput.value = '';
}

// 渲染当前闪卡
function renderCurrentCard() {
    const term = flashcards[currentIndex];
    if (!term) return;
    
    flashcardContainer.innerHTML = `
        <div class="flashcard" onclick="this.classList.toggle('flipped')">
            <div class="front">
                <h3>${term.word}</h3>
                <svg class="favorite-star ${favorites.includes(term.word) ? 'active' : ''}" 
                     onclick="toggleFavorite(event, '${term.word}')" 
                     viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
            </div>
            <div class="back">
                <h4>${term.zh}</h4>
                <p>${term.definition}</p>
            </div>
        </div>
    `;
    
    updateNavigationButtons();
}

// 更新导航按钮状态
function updateNavigationButtons() {
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === flashcards.length - 1;
}

// 显示上一张卡片
function showPreviousCard() {
    if (currentIndex > 0) {
        currentIndex--;
        renderCurrentCard();
        updateProgress();
    }
}

// 显示下一张卡片
function showNextCard() {
    if (currentIndex < flashcards.length - 1) {
        currentIndex++;
        renderCurrentCard();
        updateProgress();
    }
}

// 更新进度条
function updateProgress() {
    const progress = ((currentIndex + 1) / flashcards.length) * 100;
    progressBar.style.width = `${progress}%`;
}

// 切换收藏状态
function toggleFavorite(event, word) {
    event.stopPropagation();
    
    const index = favorites.indexOf(word);
    if (index === -1) {
        favorites.push(word);
        showToast('Added to favorites!');
    } else {
        favorites.splice(index, 1);
        showToast('Removed from favorites!');
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    renderCurrentCard();
}

// 搜索功能
function searchTerms() {
    const searchTerm = searchInput.value.toLowerCase();
    if (!searchTerm) {
        showChapterList();
        return;
    }
    
    const results = Object.entries(window.vocabData)
        .flatMap(([chapter, terms]) => 
            terms.filter(term => 
                term.word.toLowerCase().includes(searchTerm) ||
                term.zh.toLowerCase().includes(searchTerm) ||
                term.definition.toLowerCase().includes(searchTerm)
            ).map(term => ({...term, chapter}))
        );
    
    if (results.length === 0) {
        chapterGrid.innerHTML = '<p class="no-results">No matching terms found.</p>';
        return;
    }
    
    chapterGrid.innerHTML = '';
    results.forEach(term => {
        const card = document.createElement('div');
        card.className = 'chapter-card';
        card.innerHTML = `
            <h3>${term.word}</h3>
            <p>${term.zh}</p>
            <p class="chapter-name">${term.chapter}</p>
        `;
        card.addEventListener('click', () => {
            loadChapter(term.chapter);
            // 找到并显示匹配的卡片
            currentIndex = window.vocabData[term.chapter].findIndex(t => t.word === term.word);
            renderCurrentCard();
            updateProgress();
        });
        chapterGrid.appendChild(card);
    });
}

// 显示提示信息
function showToast(message) {
    toast.textContent = message;
    toast.style.opacity = '1';
    setTimeout(() => {
        toast.style.opacity = '0';
    }, 2000);
}

// 工具函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);
