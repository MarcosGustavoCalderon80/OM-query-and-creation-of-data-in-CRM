import { createElement } from '@lwc/engine-dom';
import soqlQuery from 'c/soqlQuery';

describe('c-soql-query', () => {
    afterEach(() => {
        // The jsdom instance is shared across test cases in a single file so reset the DOM
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('renders component without errors', () => {
        // Arrange
        const element = createElement('c-soql-query', {
            is: soqlQuery
        });

        // Act
        document.body.appendChild(element);

        // Assert
        expect(document.body.querySelector('c-soql-query')).not.toBeNull();
    });
});
