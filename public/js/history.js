// Theme Management
class ThemeManager {
    constructor() {
        this.themeToggle = document.getElementById('themeToggle');
        this.initialize();
    }

    initialize() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
        this.themeToggle?.addEventListener('click', () => this.toggleTheme());
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        const icon = this.themeToggle.querySelector('i');
        if (icon) {
            icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }
}

class HistoryManager {
    constructor() {
        this.confirmModal = document.getElementById('confirmModal');
        this.confirmModalAll = document.getElementById('confirmModalAll');
        this.selectAll = document.getElementById('selectAll');
        this.table = null; // Will be initialized in initializeDataTable
        this.validateModal = null;
        this.initialize();
    }

    initialize() {
        this.loadHistoryWithProgress()
            .then(() => {
                this.table = this.initializeDataTable();
                this.initializeModals();
                this.initializeResetButtons();
                this.initializeFilters();
                this.initializeSelectAll();
            })
            .catch((error) => {
                console.error('Failed to load history:', error);
                // Show error message to user and update accessibility state
                const loadingIndicator = document.getElementById('historyLoadingIndicator');
                const statusText = document.getElementById('historyLoadStatus');
                const progressContainer = document.getElementById('historyProgressContainer');
                
                if (loadingIndicator) {
                    loadingIndicator.style.display = 'block';
                }
                if (statusText) {
                    statusText.textContent = 'Error loading history. Please refresh the page.';
                }
                if (progressContainer) {
                    progressContainer.setAttribute('aria-label', 'Loading failed');
                }
            });
    }

    loadHistoryWithProgress() {
        const loadingIndicator = document.getElementById('historyLoadingIndicator');
        const tableContainer = document.getElementById('historyTableContainer');
        const progressBar = document.getElementById('historyLoadProgress');
        const progressContainer = document.getElementById('historyProgressContainer');
        const statusText = document.getElementById('historyLoadStatus');

        // Show loading state
        loadingIndicator.style.display = 'block';
        tableContainer.style.display = 'none';

        // Set a timeout to force fallback if EventSource takes too long to connect
        const connectionTimeout = setTimeout(() => {
            console.warn('EventSource connection timeout - falling back to direct loading');
            if (statusText) {
                statusText.textContent = 'Loading taking longer than expected, continuing...';
            }
        }, 5000);

        // Use EventSource for real-time progress updates
        const eventSource = new EventSource('/api/history/load-progress');
        let hasReceivedData = false;

        return new Promise((resolve, reject) => {
            // Set overall timeout as safety net
            const overallTimeout = setTimeout(() => {
                clearTimeout(connectionTimeout);
                console.warn('Overall timeout reached - forcing table display');
                eventSource.close();
                loadingIndicator.style.display = 'none';
                tableContainer.style.display = 'block';
                resolve();
            }, 15000);
            eventSource.onmessage = (event) => {
                hasReceivedData = true;
                clearTimeout(connectionTimeout);
                
                const data = JSON.parse(event.data);
                
                if (data.type === 'progress') {
                    // Update progress bar
                    const percentage = data.percentage || 0;
                    progressBar.style.width = `${percentage}%`;
                    // Update aria-valuenow for accessibility
                    if (progressContainer) {
                        progressContainer.setAttribute('aria-valuenow', percentage);
                    }
                    
                    // Build detailed status message
                    let statusMessage = data.message || 'Loading...';
                    
                    // Add step information if available
                    if (data.step && data.totalSteps) {
                        statusMessage = `[Step ${data.step}/${data.totalSteps}] ${statusMessage}`;
                    }
                    
                    // Add details if available
                    if (data.details) {
                        const detailParts = [];
                        if (data.details.documents !== undefined) {
                            detailParts.push(`${data.details.documents} docs`);
                        }
                        if (data.details.tags !== undefined) {
                            detailParts.push(`${data.details.tags} tags`);
                        }
                        if (detailParts.length > 0) {
                            statusMessage += ` (${detailParts.join(', ')})`;
                        }
                    }
                    
                    statusText.textContent = statusMessage;
                } 
                else if (data.type === 'complete') {
                    // Loading complete
                    clearTimeout(overallTimeout);
                    eventSource.close();
                    progressBar.style.width = '100%';
                    if (progressContainer) {
                        progressContainer.setAttribute('aria-valuenow', 100);
                    }
                    statusText.textContent = 'Complete!';
                    
                    // Populate filters if provided
                    if (data.filters) {
                        this.populateFilters(data.filters);
                    }
                    
                    // Small delay to show completion
                    setTimeout(() => {
                        loadingIndicator.style.display = 'none';
                        tableContainer.style.display = 'block';
                        resolve();
                    }, 300);
                }
                else if (data.type === 'error') {
                    clearTimeout(overallTimeout);
                    eventSource.close();
                    // Don't hide loading indicator or show table - let catch handler manage error state
                    reject(new Error(data.message || 'Loading failed'));
                }
            };

            eventSource.onerror = (error) => {
                console.error('EventSource error:', error);
                console.error('EventSource readyState:', eventSource.readyState);
                clearTimeout(connectionTimeout);
                clearTimeout(overallTimeout);
                eventSource.close();
                
                // If we never received any data, this is likely a connection/auth issue
                if (!hasReceivedData) {
                    console.error('EventSource failed to connect - possible auth or network error');
                    if (statusText) {
                        statusText.textContent = 'Connection failed, loading table directly...';
                    }
                }
                
                // Fallback: continue anyway after brief delay
                setTimeout(() => {
                    loadingIndicator.style.display = 'none';
                    tableContainer.style.display = 'block';
                    resolve();
                }, 1000);
            };
        });
    }

    populateFilters(filters) {
        // Populate tag filter
        const tagFilter = document.getElementById('tagFilter');
        if (tagFilter && filters.tags) {
            // Keep the "All Tags" option
            tagFilter.innerHTML = '<option value="">All Tags</option>';
            filters.tags.forEach(tag => {
                const option = document.createElement('option');
                option.value = tag.id;
                option.textContent = tag.name;
                tagFilter.appendChild(option);
            });
        }
        
        // Populate correspondent filter
        const correspondentFilter = document.getElementById('correspondentFilter');
        if (correspondentFilter && filters.correspondents) {
            // Keep the "All Correspondents" option
            correspondentFilter.innerHTML = '<option value="">All Correspondents</option>';
            filters.correspondents.forEach(corr => {
                const option = document.createElement('option');
                option.value = corr;
                option.textContent = corr;
                correspondentFilter.appendChild(option);
            });
        }
    }

    initializeDataTable() {
        return $('#historyTable').DataTable({
            serverSide: true,
            processing: true,
            ajax: {
                url: '/api/history',
                data: (d) => {
                    d.tag = $('#tagFilter').val();
                    d.correspondent = $('#correspondentFilter').val();
                }
            },
            columns: [
                {
                    data: 'document_id',
                    render: (data) => `<input type="checkbox" class="doc-select rounded" value="${data}">`,
                    orderable: false,
                    width: '40px'
                },
                { 
                    data: 'document_id',
                    width: '60px'
                },
                {
                    data: 'title',
                    render: (data, type, row) => {
                        if (type === 'display') {
                            return `
                                <div class="font-medium">${data}</div>
                                <div class="text-xs text-gray-500">Modified: ${new Date(row.created_at).toLocaleString()}</div>
                            `;
                        }
                        return data;
                    }
                },
                {
                    data: 'tags',
                    render: (data, type) => {
                        if (type === 'display') {
                            if (!data?.length) return '<span class="text-gray-400 text-sm">No tags</span>';
                            return data.map(tag => 
                                `<span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs" data-tag-id="${tag.id}">${tag.name}</span>`
                            ).join(' ');
                        }
                        return data?.map(t => t.name).join(', ') || '';
                    }
                },
                { data: 'correspondent' },
                {
                    data: null,
                    render: (data) => `
                        <div class="flex space-x-2">
                            <button onclick="window.open('${data.link}')" class="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                                <i class="fa-solid fa-eye"></i>
                                <span class="hidden sm:inline ml-1">View</span>
                            </button>
                            <button onclick="window.open('/chat?open=${data.document_id}')" class="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                                <i class="fa-solid fa-comment"></i>
                                <span class="hidden sm:inline ml-1">Chat</span>
                            </button>
                        </div>
                    `,
                    orderable: false,
                    width: '150px'
                }
            ],
            order: [[1, 'desc']], // Sort by document_id (column 1) descending - newest first
            pageLength: 10,
            dom: '<"flex flex-col sm:flex-row justify-between items-center mb-4"<"flex-1"f><"flex-none"l>>rtip',
            language: {
                search: "Search documents:",
                lengthMenu: "Show _MENU_ entries",
                info: "Showing _START_ to _END_ of _TOTAL_ documents",
                infoEmpty: "Showing 0 to 0 of 0 documents",
                infoFiltered: "(filtered from _MAX_ total documents)"
            },
            drawCallback: () => {
                // Update "Select All" checkbox state after table redraw
                this.updateSelectAllState();
                // Reattach event listeners to checkboxes
                this.attachCheckboxListeners();
            }
        });
    }

    initializeModals() {
        // Modal close handlers
        [this.confirmModal, this.confirmModalAll].forEach(modal => {
            if (!modal) return;
            
            // Close on overlay click
            modal.querySelector('.modal-overlay')?.addEventListener('click', () => {
                this.hideModal(modal);
            });

            // Close on X button click
            modal.querySelector('.modal-close')?.addEventListener('click', () => {
                this.hideModal(modal);
            });

            // Close on Cancel button click
            modal.querySelector('[id^="cancel"]')?.addEventListener('click', () => {
                this.hideModal(modal);
            });
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideModal(this.confirmModal);
                this.hideModal(this.confirmModalAll);
            }
        });

        // Reset action handlers
        document.getElementById('confirmReset')?.addEventListener('click', async () => {
            const selectedDocs = this.getSelectedDocuments();
            const success = await this.resetDocuments(selectedDocs);
            if (success) {
                this.hideModal(this.confirmModal);
            }
        });

        document.getElementById('confirmResetAll')?.addEventListener('click', async () => {
            const success = await this.resetAllDocuments();
            if (success) {
                this.hideModal(this.confirmModalAll);
            }
        });

        // Force Reload button handler
        document.getElementById('forceReloadBtn')?.addEventListener('click', async () => {
            await this.forceReloadFilters();
        });

        // Validation modal handlers
        this.validateModal = document.getElementById('validateModal');
        document.getElementById('validateHistoryBtn')?.addEventListener('click', async () => {
            await this.validateHistory();
        });

        document.getElementById('confirmRemoveMissing')?.addEventListener('click', async () => {
            const missingIds = Array.from(document.querySelectorAll('#validateResults input[type="checkbox"]:checked'))
                .map(cb => cb.value);
            if (missingIds.length === 0) {
                alert('No missing documents selected for removal.');
                return;
            }

            const success = await this.resetDocuments(missingIds);
            if (success) {
                this.hideModal(this.validateModal);
            }
        });

        document.getElementById('cancelValidate')?.addEventListener('click', () => {
            this.hideModal(this.validateModal);
        });
    }

    initializeResetButtons() {
        // Reset Selected button
        document.getElementById('resetSelectedBtn')?.addEventListener('click', () => {
            const selectedDocs = this.getSelectedDocuments();
            if (selectedDocs.length === 0) {
                alert('Please select at least one document to reset.');
                return;
            }
            this.showModal(this.confirmModal);
        });

        // Reset All button
        document.getElementById('resetAllBtn')?.addEventListener('click', () => {
            this.showModal(this.confirmModalAll);
        });
    }

    initializeFilters() {
        $('#tagFilter, #correspondentFilter').on('change', () => {
            this.table.ajax.reload();
        });
    }

    initializeSelectAll() {
        if (!this.selectAll) return;

        // Handle "Select All" checkbox
        this.selectAll.addEventListener('change', () => {
            const isChecked = this.selectAll.checked;
            const checkboxes = document.querySelectorAll('.doc-select');
            checkboxes.forEach(checkbox => {
                checkbox.checked = isChecked;
            });
        });

        // Initial state check
        this.updateSelectAllState();
    }

    attachCheckboxListeners() {
        const checkboxes = document.querySelectorAll('.doc-select');
        checkboxes.forEach(checkbox => {
            // Remove existing listeners to prevent duplicates
            checkbox.removeEventListener('change', this.handleCheckboxChange);
            // Add new listener
            checkbox.addEventListener('change', () => this.handleCheckboxChange());
        });
    }

    handleCheckboxChange() {
        this.updateSelectAllState();
    }

    updateSelectAllState() {
        if (!this.selectAll) return;

        const checkboxes = document.querySelectorAll('.doc-select');
        const checkedBoxes = document.querySelectorAll('.doc-select:checked');
        
        // Update "Select All" checkbox state
        this.selectAll.checked = checkboxes.length > 0 && checkboxes.length === checkedBoxes.length;
        
        // Update indeterminate state
        this.selectAll.indeterminate = checkedBoxes.length > 0 && checkedBoxes.length < checkboxes.length;
    }

    showModal(modal) {
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('show');
        }
    }

    hideModal(modal) {
        if (modal) {
            modal.classList.remove('show');
            modal.classList.add('hidden');
        }
    }

    getSelectedDocuments() {
        return Array.from(document.querySelectorAll('.doc-select:checked'))
            .map(checkbox => checkbox.value);
    }

    async resetDocuments(ids) {
        try {
            const response = await fetch('/api/reset-documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids })
            });

            if (!response.ok) {
                throw new Error('Failed to reset documents');
            }

            await this.table.ajax.reload();
            return true;
        } catch (error) {
            console.error('Error resetting documents:', error);
            alert('Failed to reset documents. Please try again.');
            return false;
        }
    }

    async resetAllDocuments() {
        try {
            const response = await fetch('/api/reset-all-documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error('Failed to reset all documents');
            }

            await this.table.ajax.reload();
            return true;
        } catch (error) {
            console.error('Error resetting all documents:', error);
            alert('Failed to reset all documents. Please try again.');
            return false;
        }
    }

    async validateHistory() {
        try {
            // Show a loading state in the modal while we validate
            this.showModal(this.validateModal);
            const container = document.getElementById('validateResults');
            
            // Show progress indicator
            container.innerHTML = `
                <div class="text-center py-6">
                    <div class="mb-4">
                        <i class="fas fa-spinner fa-spin text-4xl text-blue-500"></i>
                    </div>
                    <div class="mb-2 font-medium">Validating history entries...</div>
                    <div class="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                        <div id="validateProgress" class="bg-blue-500 h-2.5 rounded-full transition-all duration-300" style="width: 0%"></div>
                    </div>
                    <div id="validateStatus" class="text-sm text-gray-600">Starting validation...</div>
                </div>
            `;

            // Use EventSource for real-time progress updates
            const progressBar = document.getElementById('validateProgress');
            const statusText = document.getElementById('validateStatus');

            const eventSource = new EventSource('/api/history/validate');
            let missingDocuments = [];

            eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);
                
                if (data.type === 'progress') {
                    // Update progress bar
                    const percentage = data.percentage || 0;
                    progressBar.style.width = `${percentage}%`;
                    
                    // Update status text with real numbers
                    statusText.textContent = `Checking ${data.current} of ${data.total} entries... (${data.missing} missing found)`;
                } 
                else if (data.type === 'complete') {
                    // Validation complete
                    eventSource.close();
                    missingDocuments = data.missing || [];
                    
                    // Complete the progress bar
                    progressBar.style.width = '100%';
                    statusText.textContent = 'Validation complete!';
                    
                    // Small delay to show completion
                    setTimeout(() => {
                        this.renderValidateResults(missingDocuments);
                    }, 300);
                }
                else if (data.type === 'error') {
                    eventSource.close();
                    alert('Failed to validate history. Please try again.');
                    this.hideModal(this.validateModal);
                }
            };

            eventSource.onerror = (error) => {
                console.error('EventSource error:', error);
                eventSource.close();
                alert('Connection error during validation. Please try again.');
                this.hideModal(this.validateModal);
            };
        } catch (error) {
            console.error('Error validating history:', error);
            alert('Failed to validate history. Please try again.');
            this.hideModal(this.validateModal);
        }
    }

    renderValidateResults(missing) {
        const container = document.getElementById('validateResults');
        if (!container) return;

        if (!missing || missing.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-check-circle text-5xl text-green-500 mb-3"></i>
                    <div class="text-lg font-medium text-green-600">All history entries are valid!</div>
                    <div class="text-sm text-gray-500 mt-2">No missing documents found.</div>
                </div>
            `;
            
            // Hide the "Remove Missing" button since there's nothing to remove
            document.getElementById('confirmRemoveMissing').style.display = 'none';
            return;
        }

        // Show the "Remove Missing" button
        document.getElementById('confirmRemoveMissing').style.display = 'block';

        const list = missing.map(item => {
            return `
                <div class="flex items-center justify-between p-2 border-b hover:bg-gray-50">
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" value="${item.document_id}" class="rounded" />
                        <span class="font-medium">${item.title || ('Document ' + item.document_id)}</span>
                    </label>
                    <span class="text-sm text-gray-500">ID: ${item.document_id}</span>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="mb-3">
                <div class="flex items-center gap-2 text-yellow-600 mb-2">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span class="font-medium">${missing.length} missing document(s) found</span>
                </div>
                <p class="text-sm text-gray-600">These documents exist in history but not in Paperless-ngx. Select which ones to remove:</p>
            </div>
            <div class="mb-3 flex gap-2">
                <button id="selectAllMissingBtn" class="px-3 py-1.5 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors">
                    <i class="fas fa-check-square"></i> Select All
                </button>
                <button id="deselectAllMissingBtn" class="px-3 py-1.5 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors">
                    <i class="fas fa-square"></i> Deselect All
                </button>
            </div>
            ${list}
        `;
        
        // Add select all/deselect all button functionality
        const selectAllBtn = document.getElementById('selectAllMissingBtn');
        const deselectAllBtn = document.getElementById('deselectAllMissingBtn');
        
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => {
                const checkboxes = container.querySelectorAll('input[type="checkbox"][value]');
                checkboxes.forEach(cb => cb.checked = true);
            });
        }
        
        if (deselectAllBtn) {
            deselectAllBtn.addEventListener('click', () => {
                const checkboxes = container.querySelectorAll('input[type="checkbox"][value]');
                checkboxes.forEach(cb => cb.checked = false);
            });
        }
    }

    async forceReloadFilters() {
        const btn = document.getElementById('forceReloadBtn');
        const icon = btn.querySelector('i');
        
        // Add spinning animation
        icon.classList.add('fa-spin');
        btn.disabled = true;
        
        try {
            // Clear cache on server
            const response = await fetch('/api/history/clear-cache', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) throw new Error('Failed to clear cache');
            
            // Reload the entire page to get fresh data
            window.location.reload();
        } catch (error) {
            console.error('[ERROR] Force reload failed:', error);
            alert('Failed to reload filters. Please try again.');
            icon.classList.remove('fa-spin');
            btn.disabled = false;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
    window.historyManager = new HistoryManager();
});