// Table of Contents Generator for Notion-style documents
(function() {
  function generateTOC() {
    const tocContainer = document.getElementById('toc-list');
    if (!tocContainer) return;

    // Find all headings in the document
    const headings = document.querySelectorAll('h1, h2, h3, .notion-heading-toggle summary');
    
    if (headings.length === 0) {
      tocContainer.innerHTML = '<p style="color: rgba(55, 53, 47, 0.5); font-style: italic;">没有找到标题</p>';
      return;
    }

    const tocHTML = Array.from(headings).map(heading => {
      let text, id, level;
      
      if (heading.tagName === 'SUMMARY') {
        // Handle toggleable headings
        text = heading.textContent.trim();
        id = heading.closest('details').id || generateId(text);
        
        // Determine level based on font size or class
        if (heading.classList.contains('text-xl') || heading.classList.contains('heading-2')) {
          level = 'h2';
        } else if (heading.classList.contains('text-lg') || heading.classList.contains('heading-3')) {
          level = 'h3';
        } else {
          level = 'h2'; // default
        }
      } else {
        // Handle regular headings
        text = heading.textContent.trim();
        id = heading.id || generateId(text);
        level = heading.tagName.toLowerCase();
      }

      return `<a href="#${id}" class="toc-${level}">${text}</a>`;
    }).join('');

    tocContainer.innerHTML = tocHTML;

    // Add click handlers for smooth scrolling
    tocContainer.addEventListener('click', function(e) {
      if (e.target.tagName === 'A') {
        e.preventDefault();
        const targetId = e.target.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
          // If it's a toggleable heading and it's closed, open it first
          if (targetElement.tagName === 'DETAILS' && !targetElement.open) {
            targetElement.open = true;
          }
          
          // Smooth scroll to the target
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          
          // Add a temporary highlight
          targetElement.style.transition = 'background-color 0.3s ease';
          targetElement.style.backgroundColor = 'rgba(46, 170, 220, 0.1)';
          setTimeout(() => {
            targetElement.style.backgroundColor = '';
          }, 2000);
        }
      }
    });
  }

  function generateId(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .substring(0, 50);
  }

  // Initialize TOC when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', generateTOC);
  } else {
    generateTOC();
  }

  // Re-generate TOC if content changes (for dynamic content)
  const observer = new MutationObserver(function(mutations) {
    let shouldRegenerate = false;
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList') {
        const addedNodes = Array.from(mutation.addedNodes);
        if (addedNodes.some(node => node.nodeType === 1 && (node.tagName.match(/^H[123]$/) || node.classList.contains('notion-heading-toggle')))) {
          shouldRegenerate = true;
        }
      }
    });
    
    if (shouldRegenerate) {
      setTimeout(generateTOC, 100);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();