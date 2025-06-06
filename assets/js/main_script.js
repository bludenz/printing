document.addEventListener('DOMContentLoaded', () => {
    // Select all necessary elements at the start of DOMContentLoaded.
    const scrollDownArrow = document.querySelector('.scroll-down-arrow');
    const sidebarLinks = document.querySelectorAll('.sidebar-nav a');
    const parallaxBg = document.getElementById('parallax-bg');
    const filamentSectionsContainer = document.getElementById('filament-sections-container');
    const sectionsToReveal = document.querySelectorAll('.fade-in');
    let threshold;

    // Updated mainSections to only include existing sections with their new IDs
    const mainSections = document.querySelectorAll('#home-section, #about-section, #filament-types-section, #faq-section');

    // --- Scroll Down Arrow functionality ---
   if (scrollDownArrow) {
        scrollDownArrow.addEventListener('click', () => {
            const aboutSection = document.getElementById('about-section');

            if (aboutSection) {
                aboutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
            }
        });

    } else {
        console.warn("Scroll down arrow element not found.");
    } 

    // --- Sidebar Navigation Smooth Scrolling ---
    if (sidebarLinks.length > 0) {
        sidebarLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href');
                // Check if the link is specifically for /login.html
                if (targetId === '/login.html') {
                    // If it's /login.html, allow default navigation (redirection)
                    // No need to preventDefault() here, as we want the browser to navigate
                    // directly to /login.html
                    window.location.href = targetId; // Explicitly set the location
                } else {
                    // For all other links, prevent default and handle smooth scrolling
                    e.preventDefault(); 
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        targetElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    } else {
                        console.warn(`Target element for ID '${targetId}' not found.`);
                    }
                }
            });
        });
    } else {
        console.warn("Sidebar navigation links not found.");
    }

    // --- Active Navbar State on Scroll ---
    const navObserverOptions = {
        root: null,
        rootMargin: '0px',
        threshold: threshold // Adjust this threshold if sections aren't highlighting correctly. 0.5 means 50% of the section must be visible.
    };

    const navObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const id = entry.target.id;
            // Only update active class if the entry is intersecting
            if (entry.isIntersecting) {
                sidebarLinks.forEach(link => link.classList.remove('active'));
                const correspondingLink = document.querySelector(`.sidebar-nav a[href="#${id}"]`);
                if (correspondingLink) {
                    correspondingLink.classList.add('active');
                }
            }
        });
    }, navObserverOptions);

    mainSections.forEach(section => {
        navObserver.observe(section);
    });

    // --- Filament Data Loading & Display ---
    fetch('../assets/filaments.json')
        .then(response => {
            if (!response.ok) {
                const errorStatus = response.status;
                const errorText = response.statusText;
                throw new Error(`HTTP error! Status: ${errorStatus} ${errorText || ''} - Failed to load filaments.json. Please ensure the file exists and is accessible.`);
            }
            return response.json();
        })
        .then(data => {
            // Set background image from JSON
            if (parallaxBg && data.background_image) {
                parallaxBg.style.backgroundImage = `url('${data.background_image}')`;
            } else if (!parallaxBg) {
                console.warn("Parallax background element (#parallax-bg) not found in HTML.");
            } else if (!data.background_image) {
                console.warn("Background image URL not found in filaments.json.");
            }

            // Set glassiness strength as a CSS custom property
            if (typeof data.glassiness_strength === 'number') {
                document.documentElement.style.setProperty('--glassiness-strength', data.glassiness_strength);
                console.log('Glassiness strength set to:', data.glassiness_strength); // Log the value
            } else {
                console.warn("glassiness_strength not found or is not a number in filaments.json. Defaulting to 1.0.");
                document.documentElement.style.setProperty('--glassiness-strength', 1.0); // Fallback
            }

            const filaments = data.filaments;
            let threshold = data.threshold;

            // Clear loading messages and populate filament sections
            if (filamentSectionsContainer) {
                filamentSectionsContainer.innerHTML = ''; // Clear "Loading filament details..."
                filamentSectionsContainer.classList.add('filament-grid-container');

                filaments.forEach(filament => {
                    const sectionDiv = document.createElement('div');
                    sectionDiv.classList.add('filament-item');
                    sectionDiv.setAttribute('data-filament-id', filament.id);

                    const colors = Array.isArray(filament.colors) ? filament.colors : [];
                    const colorsHtml = colors.map(colorHex => {
                        return `<span class="color-box" style="background-color: ${colorHex};" title="${colorHex}"></span>`;
                    }).join('');

                    sectionDiv.innerHTML = `
                        <h3>${filament.name}</h3>
                        <p>${filament.description}</p>
                        <div class="filament-properties">
                            <span class="filament-property-item filament-price"><i class="fas fa-money-bill-wave"></i> Price: $${filament.base_price_per_gram.toFixed(2)}/gram</span>
                            <span class="filament-property-item filament-hardness"><i class="fas fa-ruler-combined"></i> Hardness (Shore D): ${filament.hardness_shore_d}</span>
                            <span class="filament-property-item filament-colors colors-list">
                                <i class="fas fa-palette"></i> Colors:
                                <div class="color-boxes-wrapper">
                                    ${colorsHtml}
                                </div>
                            </span>
                        </div>
                    `;
                    filamentSectionsContainer.appendChild(sectionDiv);
                });
            } else {
                console.error("Error: Element with ID 'filament-sections-container' not found. Cannot display filament details.");
                const errorHtml = `<p style="color: #ff6b6b; text-align: center; padding: 20px;">
                                    <strong>Error:</strong> Filament details container missing in HTML.
                                  </p>`;
                document.querySelector('#filament-types-section')?.insertAdjacentHTML('beforeend', errorHtml);
            }

            // --- Scroll Reveal Effect (after content is loaded) ---
            const observerOptions = {
                root: null,
                rootMargin: '0px',
                threshold: 0.1
            };

            const observer = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('show');
                        observer.unobserve(entry.target);
                    }
                });
            }, observerOptions);

            if (sectionsToReveal.length > 0) {
                sectionsToReveal.forEach(section => {
                    observer.observe(section);
                });
            } else {
                console.warn("No elements with class 'fade-in' found for scroll reveal.");
            }

            // --- Parallax Effect ---
            if (parallaxBg) {
                window.addEventListener('scroll', () => {
                    const scrollPosition = window.pageYOffset;
                    parallaxBg.style.transform = `scale(1.15) translateY(${scrollPosition * 0.3}px)`;
                });
            }
        })
        .catch(error => {
            console.error('An error occurred during data loading or processing:', error);
            const globalErrorDiv = document.createElement('div');
            globalErrorDiv.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; padding: 15px;
                background-color: rgba(255, 0, 0, 0.8); color: white; text-align: center;
                font-family: sans-serif; z-index: 9999;
                box-shadow: 0 0 10px rgba(0,0,0,0.5);
            `;
            globalErrorDiv.innerHTML = `
                <strong>Critical Error:</strong> Could not load essential data. Please check your console (F12) for details.
                <br>Reason: ${error.message || 'Unknown error.'}
            `;
            document.body.prepend(globalErrorDiv);

            if (parallaxBg) {
                parallaxBg.style.backgroundImage = 'url("https://source.unsplash.com/random/1920x1080/?futuristic-tech,dark-abstract")';
                parallaxBg.style.filter = 'blur(10px) brightness(0.7)';
            }
        });
});
