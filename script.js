const searchInput = document.getElementById('search');
const customSuggestions = document.getElementById('customSuggestions');
const output = document.getElementById('output');

// Fetch suggestions from Wikipedia API
async function fetchSuggestions(query) {
  const endpoint = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=5&namespace=0&format=json&origin=*`;

  try {
    const res = await fetch(endpoint);
    const data = await res.json();
    showCustomSuggestions(data[1]);
  } catch (err) {
    console.error('Error fetching suggestions:', err);
  }
}

// Display suggestion dropdown
function showCustomSuggestions(suggestions) {
  if (suggestions.length === 0) {
    customSuggestions.classList.remove('visible');
    return;
  }

  customSuggestions.innerHTML = suggestions
    .map(item => `<div class="suggestion-item">${item}</div>`)
    .join('');
  customSuggestions.classList.add('visible');

  document.querySelectorAll('.suggestion-item').forEach(item => {
    item.addEventListener('click', () => {
      searchInput.value = item.textContent;
      customSuggestions.classList.remove('visible');
      searchWikipedia();
    });
  });
}

// Fetch and display Wikipedia article summary
async function searchWikipedia() {
  const query = searchInput.value.trim();
  if (!query) return;

  output.style.opacity = 0;
  output.style.transform = 'translateY(10px)';

  const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error('Topic not found');

    const data = await response.json();

    document.getElementById('title').textContent = data.title;
    document.getElementById('description').textContent = data.extract;
    document.getElementById('image').src = data.thumbnail
      ? data.thumbnail.source
      : 'https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg';

    output.style.display = 'flex';

    setTimeout(() => {
      output.style.opacity = 1;
      output.style.transform = 'translateY(0)';
    }, 100);
  } catch (error) {
    alert('Could not fetch summary. Please try another topic.');
  }
}

// Event Listeners

// Suggest as user types
searchInput.addEventListener('input', (e) => {
  const value = e.target.value;
  if (value.length > 2) {
    fetchSuggestions(value);
  } else {
    customSuggestions.classList.remove('visible');
  }
});

// Hide suggestions on blur
searchInput.addEventListener('blur', () => {
  setTimeout(() => customSuggestions.classList.remove('visible'), 150);
});

// Handle Enter key
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    customSuggestions.classList.remove('visible');
    searchWikipedia();
  }
});
