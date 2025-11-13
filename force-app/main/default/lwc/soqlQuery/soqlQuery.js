import executeSoqlQuery from '@salesforce/apex/SoqlQueryController.executeQuery';
import getObjectFields from '@salesforce/apex/SoqlQueryController.getObjectFields';
import { LightningElement, track } from 'lwc';

export default class SoqlQueryExecutor extends LightningElement {
    @track soqlQuery = '';
    @track records = [];
    @track columns = [];
    @track error;
    @track fieldSuggestions = [];
    @track allFields = {};
    @track cursorPosition = 0;
    @track isLoading = false;
    @track queryContext = ''; // 'select', 'where', 'other'
    
    objectName = '';
    isSelectingField = false;
    debounceTimeout;

    connectedCallback() {
        // Inicializar con una consulta básica
        this.soqlQuery = 'SELECT  FROM Account';
        this.cursorPosition = 7; // Posición después de "SELECT "
    }

    handleQueryChange(event) {
        this.soqlQuery = event.target.value;
        this.cursorPosition = event.target.selectionStart;
        
        console.log('Cursor position:', this.cursorPosition);
        console.log('Query:', this.soqlQuery);
        
        if (!this.isSelectingField) {
            this.determineQueryContext();
            this.extractObjectNameFromQuery();
            
            console.log('Context:', this.queryContext);
            console.log('Object:', this.objectName);
            
            if (this.objectName) {
                this.debouncedFetchFields();
            } else {
                this.fieldSuggestions = [];
            }
        }
        this.isSelectingField = false;
    }

    // Determinar el contexto de la consulta (SELECT, WHERE, etc.)
    determineQueryContext() {
        const queryBeforeCursor = this.soqlQuery.substring(0, this.cursorPosition).toLowerCase();
        const fullQuery = this.soqlQuery.toLowerCase();
        
        console.log('Query before cursor:', queryBeforeCursor);
        
        const hasSelect = queryBeforeCursor.includes('select');
        const hasFrom = queryBeforeCursor.includes('from');
        const hasWhere = fullQuery.includes('where');
        const wherePosition = fullQuery.indexOf('where');
        
        if (hasSelect && !hasFrom) {
            this.queryContext = 'select';
        } else if (hasWhere && this.cursorPosition > wherePosition) {
            this.queryContext = 'where';
        } else {
            this.queryContext = 'other';
        }
        
        console.log('Determined context:', this.queryContext);
    }

    // Debounce para evitar múltiples llamadas a Apex
    debouncedFetchFields() {
        clearTimeout(this.debounceTimeout);
        this.debounceTimeout = setTimeout(() => {
            this.fetchFields(this.objectName);
        }, 300);
    }

    handleKeyDown(event) {
        console.log('Key pressed:', event.key);
        
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.handleExecuteQuery();
        } else if (event.key === 'Escape') {
            this.fieldSuggestions = [];
        } else if (event.key === 'Tab' && this.fieldSuggestions.length > 0) {
            event.preventDefault();
            this.handleTabKey();
        } else if (event.key === 'ArrowDown' && this.fieldSuggestions.length > 0) {
            event.preventDefault();
            this.focusFirstSuggestion();
        } else if (event.key === ' ') {
            // Al presionar espacio, actualizar sugerencias
            setTimeout(() => {
                this.generateFieldSuggestions();
            }, 10);
        }
    }

    handleTabKey() {
        const firstSuggestion = this.fieldSuggestions[0];
        if (firstSuggestion) {
            this.insertFieldAtCursor(firstSuggestion);
        }
    }

    focusFirstSuggestion() {
        const firstSuggestionElement = this.template.querySelector('.suggestion-item');
        if (firstSuggestionElement) {
            firstSuggestionElement.focus();
        }
    }

    extractObjectNameFromQuery() {
        const queryLower = this.soqlQuery.toLowerCase();
        const fromIndex = queryLower.indexOf('from ');
        
        if (fromIndex > -1) {
            const afterFrom = this.soqlQuery.slice(fromIndex + 5).trim();
            let endIndex = afterFrom.length;
            
            const delimiters = [' where ', ' limit ', ' group by ', ' order by ', '\n', ';', ' '];
            for (const delimiter of delimiters) {
                const delimiterIndex = afterFrom.toLowerCase().indexOf(delimiter);
                if (delimiterIndex > -1 && delimiterIndex < endIndex) {
                    endIndex = delimiterIndex;
                }
            }
            
            this.objectName = afterFrom.substring(0, endIndex)
                .replace(/[,\s;]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
                
            console.log('Extracted object name:', this.objectName);
        } else {
            this.objectName = '';
        }
    }

    async fetchFields(objectName) {
        if (!objectName) {
            this.fieldSuggestions = [];
            return;
        }
        
        try {
            console.log('Fetching fields for:', objectName);
            
            // Verificar si ya tenemos los campos en cache
            if (!this.allFields[objectName]) {
                const result = await getObjectFields({ objectName });
                this.allFields[objectName] = result;
                console.log('Fields fetched:', result);
            }
            
            this.generateFieldSuggestions();
            
        } catch (error) {
            console.error('Error en fetchFields:', error);
            this.fieldSuggestions = [];
        }
    }

    generateFieldSuggestions() {
        if (!this.allFields[this.objectName]) {
            console.log('No fields available for:', this.objectName);
            this.fieldSuggestions = [];
            return;
        }
        
        const queryBeforeCursor = this.soqlQuery.substring(0, this.cursorPosition);
        const lastWordBeforeCursor = queryBeforeCursor.split(/[\s,()]+/).pop().toLowerCase();
        
        console.log('Last word before cursor:', lastWordBeforeCursor);
        
        let allFieldNames = [];
        
        // Obtener campos según el contexto
        if (this.queryContext === 'select') {
            // En SELECT: todos los campos del objeto principal y relaciones
            for (let obj in this.allFields[this.objectName]) {
                allFieldNames = allFieldNames.concat(this.allFields[this.objectName][obj]);
            }
        } else if (this.queryContext === 'where') {
            // En WHERE: solo campos del objeto principal (para condiciones simples)
            allFieldNames = this.allFields[this.objectName][this.objectName] || [];
        } else {
            // Otros contextos: campos limitados
            allFieldNames = this.allFields[this.objectName][this.objectName] || [];
        }
        
        console.log('Available fields:', allFieldNames.length);
        
        // Filtrar y ordenar sugerencias
        this.fieldSuggestions = allFieldNames
            .filter(field => {
                if (!lastWordBeforeCursor || lastWordBeforeCursor.length < 1) {
                    return true; // Mostrar todos si no hay texto
                }
                return field.toLowerCase().includes(lastWordBeforeCursor);
            })
            .sort((a, b) => {
                const aStarts = a.toLowerCase().startsWith(lastWordBeforeCursor);
                const bStarts = b.toLowerCase().startsWith(lastWordBeforeCursor);
                if (aStarts && !bStarts) return -1;
                if (!aStarts && bStarts) return 1;
                
                // Priorizar campos comunes
                const commonFields = ['id', 'name', 'createddate', 'lastmodifieddate'];
                const aIsCommon = commonFields.includes(a.toLowerCase());
                const bIsCommon = commonFields.includes(b.toLowerCase());
                if (aIsCommon && !bIsCommon) return -1;
                if (!aIsCommon && bIsCommon) return 1;
                
                return a.localeCompare(b);
            })
            .slice(0, 15); // Más sugerencias pero limitadas
            
        console.log('Filtered suggestions:', this.fieldSuggestions);
    }

    handleFieldClick(event) {
        event.stopPropagation();
        this.isSelectingField = true;
        const selectedField = event.currentTarget.dataset.field;
        console.log('Field selected:', selectedField);
        
        if (selectedField) {
            this.insertFieldAtCursor(selectedField);
        }
    }

    handleSuggestionKeyDown(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            event.stopPropagation();
            const selectedField = event.currentTarget.dataset.field;
            if (selectedField) {
                this.insertFieldAtCursor(selectedField);
            }
        } else if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            this.fieldSuggestions = [];
            this.template.querySelector('lightning-textarea').focus();
        }
    }

    insertFieldAtCursor(selectedField) {
        const textarea = this.template.querySelector('lightning-textarea');
        if (!textarea) return;
        
        const currentValue = this.soqlQuery;
        const cursorPos = this.cursorPosition;
        
        console.log('Inserting field:', selectedField, 'at position:', cursorPos);
        console.log('Current value:', currentValue);
        
        const textBeforeCursor = currentValue.substring(0, cursorPos);
        const textAfterCursor = currentValue.substring(cursorPos);
        
        // Encontrar la última palabra parcial antes del cursor
        const words = textBeforeCursor.split(/[\s,]+/);
        const lastWord = words[words.length - 1] || '';
        
        console.log('Last word:', lastWord);
        
        let newText;
        let newCursorPos;
        
        if (this.queryContext === 'select') {
            // En SELECT: reemplazar solo la última palabra o agregar después
            if (lastWord && lastWord.length > 0) {
                // Reemplazar la última palabra
                const beforeLastWord = textBeforeCursor.substring(0, textBeforeCursor.length - lastWord.length);
                newText = beforeLastWord + selectedField + textAfterCursor;
                newCursorPos = beforeLastWord.length + selectedField.length;
            } else {
                // Agregar después del último campo
                let separator = '';
                if (textBeforeCursor.trim().endsWith(',')) {
                    separator = ' ';
                } else if (textBeforeCursor.trim().length > 0 && !textBeforeCursor.endsWith(' ')) {
                    separator = ', ';
                }
                newText = textBeforeCursor + separator + selectedField + textAfterCursor;
                newCursorPos = textBeforeCursor.length + separator.length + selectedField.length;
            }
        } else {
            // En WHERE u otros: reemplazar última palabra o insertar
            if (lastWord && lastWord.length > 0) {
                const beforeLastWord = textBeforeCursor.substring(0, textBeforeCursor.length - lastWord.length);
                newText = beforeLastWord + selectedField + textAfterCursor;
                newCursorPos = beforeLastWord.length + selectedField.length;
            } else {
                newText = textBeforeCursor + selectedField + textAfterCursor;
                newCursorPos = textBeforeCursor.length + selectedField.length;
            }
        }
        
        console.log('New text:', newText);
        console.log('New cursor position:', newCursorPos);
        
        // Actualizar el valor
        this.soqlQuery = newText;
        
        // Limpiar sugerencias
        this.fieldSuggestions = [];
        
        // Enfocar y posicionar el cursor después de la actualización
        setTimeout(() => {
            if (textarea) {
                textarea.focus();
                textarea.setSelectionRange(newCursorPos, newCursorPos);
            }
        }, 0);
    }

    async handleExecuteQuery() {
        if (!this.soqlQuery.trim()) {
            this.error = 'Por favor, ingresa una consulta SOQL válida.';
            this.records = [];
            this.columns = [];
            return;
        }

        this.isLoading = true;
        this.error = undefined;

        try {
            const result = await executeSoqlQuery({ query: this.soqlQuery });
            this.processQueryResult(result);
        } catch (error) {
            this.error = error.body?.message || error.message || 'Error al ejecutar consulta';
            this.records = [];
            this.columns = [];
        } finally {
            this.isLoading = false;
        }
    }

    processQueryResult(result) {
        this.records = result.map(record => {
            const flattenedRecord = { Id: record.Id };
            Object.keys(record).forEach(key => {
                if (key !== 'attributes') {
                    if (typeof record[key] === 'object' && record[key] !== null && !Array.isArray(record[key])) {
                        Object.keys(record[key]).forEach(subKey => {
                            if (subKey !== 'attributes') {
                                flattenedRecord[`${key}.${subKey}`] = record[key][subKey];
                            }
                        });
                    } else {
                        flattenedRecord[key] = record[key];
                    }
                }
            });
            
            const objectType = record.attributes?.type || 'Unknown';
            flattenedRecord.recordUrl = `/lightning/r/${objectType}/${record.Id}/view`;
            return flattenedRecord;
        });

        if (result.length > 0) {
            this.generateColumns(this.records[0]);
        } else {
            this.columns = [];
        }
    }

    generateColumns(firstRecord) {
        const fieldNames = Object.keys(firstRecord)
            .filter(key => key !== 'attributes' && key !== 'recordUrl');
        
        this.columns = fieldNames.map(key => {
            const isUrl = key === 'Id' || key.endsWith('.Id');
            const isNameField = key === 'Name' || key.endsWith('.Name');
            
            return {
                label: this.formatColumnLabel(key),
                fieldName: key,
                type: isUrl ? 'url' : 'text',
                typeAttributes: isUrl ? {
                    label: isNameField ? { fieldName: key } : { fieldName: 'Id' },
                    target: '_blank'
                } : undefined
            };
        });

        this.columns.push({
            label: 'Ver Registro',
            fieldName: 'recordUrl',
            type: 'url',
            typeAttributes: {
                label: firstRecord.Name ? { fieldName: 'Name' } : { fieldName: 'Id' },
                target: '_blank'
            }
        });
    }

    formatColumnLabel(fieldName) {
        return fieldName
            .replace(/__c/g, '')
            .replace(/_/g, ' ')
            .replace(/\./g, ' > ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    get recordsLength() {
        return this.records?.length || 0;
    }

    get hasRecords() {
        return this.records && this.records.length > 0;
    }

    get showSuggestions() {
        return this.fieldSuggestions && this.fieldSuggestions.length > 0;
    }
}