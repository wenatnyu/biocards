// 状态管理对象
const state = {
  currentChapter: null,     // 当前章节
  isExamMode: false,        // 是否考查模式
  allTerms: [],             // 所有词汇
  currentTerms: [],         // 当前显示词汇
  currentIndex: 0,          // 当前进度索引
  favorites: new Set()       // 收藏词汇
};

// 初始化函数
async function init() {
  // 加载词汇数据
  const response = await fetch('docs/vocab.json');
  const data = await response.json();
  state.allTerms = data.chapters.flatMap(ch => ch.terms);
  
  // 加载收藏数据
  const savedFavorites = localStorage.getItem('favorites');
  if (savedFavorites) {
    state.favorites = new Set(JSON.parse(savedFavorites));
  }
  
  // 渲染章节列表
  renderChapterList(data.chapters);
}

// 渲染章节列表
function renderChapterList(chapters) {
  const container = document.getElementById('chapterList');
  container.innerHTML = chapters.map(ch => `
    <div class="chapter-card" onclick="loadChapter(${ch.id})">
      <h3>Chapter ${ch.id}</h3>
      <p>${ch.title}</p>
    </div>
  `).join('');
}

// 加载模式选择
function loadMode(mode) {
  document.getElementById('home').classList.add('hidden');
  document.getElementById('flashcardContainer').classList.remove('hidden');
  
  switch(mode) {
    case 'chapter':
      state.currentTerms = state.allTerms.filter(t => t.chapter === state.currentChapter);
      break;
    case 'random':
      state.currentTerms = [...state.allTerms].sort(() => Math.random() - 0.5);
      break;
    case 'favorite':
      state.currentTerms = state.allTerms.filter(t => state.favorites.has(t.word));
      break;
  }
  
  renderFlashcards();
}

// 渲染闪卡
function renderFlashcards() {
  const container = document.getElementById('flashcards');
  container.innerHTML = '';
  
  if (state.isExamMode) {
    // 考查模式渲染单卡
    const card = createFlashcard(state.currentTerms[state.currentIndex]);
    container.appendChild(card);
    updateProgress();
  } else {
    // 速查模式渲染网格
    state.currentTerms.forEach(term => {
      container.appendChild(createFlashcard(term));
    });
  }
}

// 创建单个闪卡
function createFlashcard(term) {
  const card = document.createElement('div');
  card.className = `flashcard ${state.isExamMode ? 'flashcard-single' : ''}`;
  card.innerHTML = `
    <!-- 收藏按钮 -->
    <svg class="favorite-star ${state.favorites.has(term.word) ? 'active' : ''}" 
         onclick="toggleFavorite('${term.word}')" 
         viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" 
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
    
    <!-- 正面内容 -->
    <div class="front">
      <h3>${term.word}</h3>
    </div>
    
    <!-- 背面内容 -->
    <div class="back">
      <h4>${term.zh}</h4>
      <p>${term.definition}</p>
    </div>
  `;
  
  // 添加点击事件
  if (!state.isExamMode) {
    card.onclick = () => flipCard(card);
  }
  return card;
}

// 翻转闪卡
function flipCard(card) {
  card.classList.toggle('flipped');
}

// 切换收藏
function toggleFavorite(word) {
  if (state.favorites.has(word)) {
    state.favorites.delete(word);
    showToast(`${word} 已取消收藏`);
  } else {
    state.favorites.add(word);
    showToast(`${word} 已收藏`);
  }
  
  // 保存到本地存储
  localStorage.setItem('favorites', JSON.stringify([...state.favorites]));
  
  // 更新星星图标
  document.querySelectorAll('.favorite-star').forEach(star => {
    if (star.parentElement.querySelector('h3').textContent === word) {
      star.classList.toggle('active');
    }
  });
}

// 显示提示信息
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.style.animation = 'none';
  void toast.offsetWidth; // 触发重绘
  toast.style.animation = null;
}

// 初始化执行
init();
// 在 init() 函数末尾添加
console.log('初始化完成，当前词汇数:', state.allTerms.length);
console.log('收藏数据:', state.favorites);
// 修改 loadMode 函数
function loadMode(mode) {
  console.log(`加载模式: ${mode}`);
  if (mode === 'favorite' && state.favorites.size === 0) {
    alert('您尚未收藏任何词汇！');
    return;
  }
  // ...原有代码
}
/* 在 styles.css 添加 */
@media (max-width: 480px) {
  .flashcard {
    font-size: 14px;
    padding: 15px;
  }
  
  .favorite-star {
    width: 20px;
    height: 20px;
  }
}
