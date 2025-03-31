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
    objectName = '';
    isSelectingField = false;

    handleQueryChange(event) {
        this.soqlQuery = event.target.value;
        this.cursorPosition = event.target.selectionStart;
        
        if (!this.isSelectingField) {
            this.extractObjectNameFromQuery();
            if (this.objectName) {
                this.fetchFields(this.objectName);
            } else {
                this.fieldSuggestions = [];
            }
        }
        this.isSelectingField = false;
    }

    handleKeyDown(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.handleExecuteQuery();
        } else if (event.key === 'Escape') {
            this.fieldSuggestions = [];
        } else if (event.key === 'Tab' && this.fieldSuggestions.length > 0) {
            event.preventDefault();
            this.handleTabKey();
        }
    }

    handleTabKey() {
        const firstSuggestion = this.fieldSuggestions[0];
        if (firstSuggestion) {
            this.insertFieldAtCursor(firstSuggestion);
        }
    }

    extractObjectNameFromQuery() {
        const queryLower = this.soqlQuery.toLowerCase();
        const fromIndex = queryLower.lastIndexOf('from ');
        
        if (fromIndex > -1) {
            const afterFrom = this.soqlQuery.slice(fromIndex + 5).trim();
            let endIndex = afterFrom.length;
            
            // Buscar los siguientes posibles delimitadores
            const delimiters = [' where ', ' limit ', ' group by ', ' order by ', '\n'];
            for (const delimiter of delimiters) {
                const delimiterIndex = afterFrom.toLowerCase().indexOf(delimiter);
                if (delimiterIndex > -1 && delimiterIndex < endIndex) {
                    endIndex = delimiterIndex;
                }
            }
            
            this.objectName = afterFrom.substring(0, endIndex)
                .replace(/[,\s;]/g, '')
                .replace(/\s+/g, ' ');
        } else {
            this.objectName = '';
        }
    }

    fetchFields(objectName) {
        if (!objectName) return;
        
        getObjectFields({ objectName })
            .then(result => {
                this.allFields = result;
                let allFieldNames = [];
                
                // Obtener todos los campos del objeto principal y relacionados
                for (let obj in result) {
                    allFieldNames = allFieldNames.concat(result[obj]);
                }
                
                // Obtener el texto actual alrededor del cursor para sugerencias
                const queryBeforeCursor = this.soqlQuery.substring(0, this.cursorPosition);
                const lastWordBeforeCursor = queryBeforeCursor.split(/[\s,]+/).pop().toLowerCase();
                
                // Filtrar campos que coincidan con lo que se está escribiendo
                this.fieldSuggestions = allFieldNames
                    .filter(field => field.toLowerCase().includes(lastWordBeforeCursor))
                    .sort((a, b) => {
                        // Ordenar por coincidencia exacta al principio
                        if (a.toLowerCase().startsWith(lastWordBeforeCursor)) return -1;
                        if (b.toLowerCase().startsWith(lastWordBeforeCursor)) return 1;
                        return a.localeCompare(b);
                    });
            })
            .catch(error => {
                this.error = error.body?.message || error.message || 'Error al obtener campos';
                this.fieldSuggestions = [];
                console.error('Error en fetchFields:', error);
            });
    }

    handleFieldClick(event) {
        this.isSelectingField = true;
        const selectedField = event.target.dataset.field;
        if (selectedField) {
            const textarea = this.template.querySelector('lightning-textarea');
            const currentValue = textarea.value;
            const cursorPos = textarea.selectionStart;
            
            // Obtener el texto antes y después del cursor
            const textBeforeCursor = currentValue.substring(0, cursorPos);
            const textAfterCursor = currentValue.substring(cursorPos);
            
            // Encontrar la última palabra parcial antes del cursor
            const lastPartialWordMatch = textBeforeCursor.match(/([\w.]+)$/);
            const lastPartialWord = lastPartialWordMatch ? lastPartialWordMatch[0] : '';
            
            // Determinar contexto (SELECT, FROM, WHERE, etc.)
            const queryBeforeCursorLower = textBeforeCursor.toLowerCase();
            const isInSelect = queryBeforeCursorLower.includes('select') && 
                             !queryBeforeCursorLower.includes('from');
            
            // Construir el nuevo texto
            let newText;
            if (isInSelect) {
                // En cláusula SELECT: reemplazar solo la palabra parcial
                const beforePartial = textBeforeCursor.substring(0, textBeforeCursor.length - lastPartialWord.length);
                
                // Manejar comas correctamente
                let separator = '';
                if (beforePartial.trim().endsWith(',')) {
                    separator = ' ';
                } else if (beforePartial.trim().length > 0 && !beforePartial.trim().endsWith(' ')) {
                    separator = ', ';
                }
                
                newText = beforePartial + separator + selectedField + textAfterCursor;
            } else {
                // En otras cláusulas: insertar el campo completo
                newText = textBeforeCursor + selectedField + textAfterCursor;
            }
            
            // Actualizar el valor
            this.soqlQuery = newText;
            
            // Calcular nueva posición del cursor
            const newCursorPos = textBeforeCursor.length - lastPartialWord.length + selectedField.length + 
                              (isInSelect && !textBeforeCursor.trim().endsWith(',') && 
                               textBeforeCursor.trim().length > 0 ? 2 : 0);
            
            // Enfocar y posicionar el cursor
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(newCursorPos, newCursorPos);
                this.fieldSuggestions = [];
            }, 0);
        }
    }

    handleExecuteQuery() {
        if (this.soqlQuery.trim()) {
            executeSoqlQuery({ query: this.soqlQuery })
                .then(result => {
                    this.records = result.map(record => {
                        const flattenedRecord = {};
                        Object.keys(record).forEach(key => {
                            if (key !== 'attributes') {
                                if (typeof record[key] === 'object' && record[key] !== null) {
                                    Object.keys(record[key]).forEach(subKey => {
                                        flattenedRecord[`${key}_${subKey}`] = record[key][subKey];
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
                        this.columns = Object.keys(this.records[0])
                            .filter(key => key !== 'attributes' && key !== 'recordUrl')
                            .map(key => ({
                                label: key.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
                                fieldName: key,
                                type: key === 'recordUrl' ? 'url' : 'text',
                                typeAttributes: key === 'recordUrl' ? { 
                                    label: { 
                                        fieldName: this.records[0].Name ? 'Name' : 'Id' 
                                    }, 
                                    target: '_blank' 
                                } : null
                            }));
                        
                        // Añadir columna de URL si existe
                        if (this.records[0].recordUrl) {
                            this.columns.push({
                                label: 'Ver Registro',
                                fieldName: 'recordUrl',
                                type: 'url',
                                typeAttributes: {
                                    label: { 
                                        fieldName: this.records[0].Name ? 'Name' : 'Id' 
                                    },
                                    target: '_blank'
                                }
                            });
                        }
                    } else {
                        this.columns = [];
                    }
                    this.error = undefined;
                })
                .catch(error => {
                    this.error = error.body?.message || error.message || 'Error al ejecutar consulta';
                    this.records = [];
                    this.columns = [];
                });
        } else {
            this.error = 'Por favor, ingresa una consulta SOQL válida.';
            this.records = [];
            this.columns = [];
        }
    }

    get recordsLength() {
        return this.records?.length || 0;
    }

    get hasRecords() {
        return this.records && this.records.length > 0;
    }
}