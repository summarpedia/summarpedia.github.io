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

// Fetch and display Wikipedia article summary and sections
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

    // Title and description (summary)
    document.getElementById('title').textContent = data.title;
    document.getElementById('description').textContent = data.extract;

    // Handle long summaries
    if (data.extract.length > 500) {
      const readMoreLink = document.createElement('a');
      readMoreLink.href = data.content_urls.desktop.page;
      readMoreLink.target = '_blank';
      readMoreLink.textContent = 'Read full article';
      document.getElementById('description').appendChild(readMoreLink);
    }

    // Display an image if available
    document.getElementById('image').src = data.thumbnail
      ? data.thumbnail.source
      : 'https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg';

    // Fetch additional sections and other data
    fetchSections(query);
    fetchCategories(query);
    fetchLinks(query);
    fetchReferences(query);

    // Show the output
    output.style.display = 'flex';
    setTimeout(() => {
      output.style.opacity = 1;
      output.style.transform = 'translateY(0)';
    }, 100);
  } catch (error) {
    alert('Could not fetch summary. Please try another topic.');
  }
}

// Fetch additional sections from Wikipedia API
async function fetchSections(query) {
  const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/sections/${encodeURIComponent(query)}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error('Sections not found');

    const data = await response.json();
    displaySections(data.items);
  } catch (error) {
    console.error('Error fetching sections:', error);
  }
}

// Display sections in a user-friendly format
function displaySections(sections) {
  const sectionsContainer = document.getElementById('sections');
  sectionsContainer.innerHTML = '';

  sections.forEach(section => {
    const sectionElement = document.createElement('div');
    sectionElement.classList.add('section');
    sectionElement.innerHTML = `
      <h3>${section.line}</h3>
      <p>${section.extract || 'No additional information available for this section.'}</p>
    `;
    sectionsContainer.appendChild(sectionElement);
  });
}

// Fetch categories (topics related to the article)
async function fetchCategories(query) {
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(query)}&prop=categories&format=json`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error('Categories not found');

    const data = await response.json();
    const categories = data.query.pages[Object.keys(data.query.pages)[0]].categories || [];
    displayCategories(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
  }
}

// Display categories
function displayCategories(categories) {
  const categoriesContainer = document.getElementById('categories');
  categoriesContainer.innerHTML = '';

  if (categories.length === 0) {
    categoriesContainer.innerHTML = '<p>No categories available for this article.</p>';
    return;
  }

  const categoryList = categories
    .map(category => `<li>${category.title}</li>`)
    .join('');
  categoriesContainer.innerHTML = `<h4>Categories:</h4><ul>${categoryList}</ul>`;
}

// Fetch links (related pages/links in the article)
async function fetchLinks(query) {
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(query)}&prop=links&format=json&pllimit=5`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error('Links not found');

    const data = await response.json();
    const links = data.query.pages[Object.keys(data.query.pages)[0]].links || [];
    displayLinks(links);
  } catch (error) {
    console.error('Error fetching links:', error);
  }
}

// Display links
function displayLinks(links) {
  const linksContainer = document.getElementById('links');
  linksContainer.innerHTML = '';

  if (links.length === 0) {
    linksContainer.innerHTML = '<p>No links available for this article.</p>';
    return;
  }

  const linkList = links
    .map(link => `<li><a href="https://en.wikipedia.org/wiki/${link.title}" target="_blank">${link.title}</a></li>`)
    .join('');
  linksContainer.innerHTML = `<h4>Related Links:</h4><ul>${linkList}</ul>`;
}

// Fetch references (cited articles or resources in the article)
async function fetchReferences(query) {
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(query)}&prop=revisions&rvprop=content&format=json`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error('References not found');

    const data = await response.json();
    const references = extractReferencesFromContent(data.query.pages[Object.keys(data.query.pages)[0]].revisions[0]['*']);
    displayReferences(references);
  } catch (error) {
    console.error('Error fetching references:', error);
  }
}

// Extract references from the raw content
function extractReferencesFromContent(content) {
  const regex = /\[\[([^\[\]]+)\]\]/g;
  const references = [];
  let match;
  while (match = regex.exec(content)) {
    references.push(match[1]);
  }
  return references;
}

// Display references
function displayReferences(references) {
  const referencesContainer = document.getElementById('references');
  referencesContainer.innerHTML = '';

  if (references.length === 0) {
    referencesContainer.innerHTML = '<p>No references available for this article.</p>';
    return;
  }

  const referenceList = references
    .map(reference => `<li>${reference}</li>`)
    .join('');
  referencesContainer.innerHTML = `<h4>References:</h4><ul>${referenceList}</ul>`;
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
