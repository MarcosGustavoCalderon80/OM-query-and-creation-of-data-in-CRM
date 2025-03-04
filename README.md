# CRM Search and Creation App

Descripción
    El proyecto "CRM Search and Creation" es una aplicación en Salesforce Lightning que permite realizar la búsqueda y creación de cuentas, órdenes y contactos dentro de un sistema CRM. La aplicación se compone de varias funcionalidades, que incluyen la búsqueda de cuentas y órdenes, la creación de nuevas cuentas, órdenes y contactos, y la integración con Apex para la gestión de datos.

# Funcionalidades
1. Búsqueda de Cuentas y Órdenes
    La aplicación permite a los usuarios buscar cuentas y órdenes mediante un campo de búsqueda. Los resultados se muestran en tarjetas separadas para cuentas y órdenes.

    Cuentas: Los resultados de la búsqueda de cuentas se presentan con el nombre de la cuenta y su ID. Al hacer clic en el ID de la cuenta, se redirige a la vista de la cuenta en Salesforce.
    Órdenes: Los resultados de la búsqueda de órdenes se presentan con el nombre de la orden y su número. Al hacer clic en el número de la orden, se redirige a la vista de la orden en Salesforce.

2. Creación de Cuentas
    Los usuarios pueden crear nuevas cuentas proporcionando el nombre de la cuenta, el número de teléfono y el sitio web. Al crear la cuenta, la aplicación valida los datos y, si todo es correcto, la cuenta se crea en Salesforce.

3. Creación de Órdenes
    Los usuarios pueden crear nuevas órdenes proporcionando información como el nombre de la orden, la fecha de inicio, la gestión, la subgestión, el método de entrega y el ID de cuenta. La creación de una nueva cuenta también es posible si no se proporciona un ID de cuenta existente.

4. Creación de Contactos
    Los usuarios pueden crear nuevos contactos relacionados con una cuenta existente o una nueva cuenta. Los campos incluyen el nombre, apellido, correo electrónico, teléfono y la ID de la cuenta.

# Estructura del Proyecto

# El proyecto está compuesto por los siguientes componentes principales:

    Componente de Búsqueda: Permite realizar la búsqueda de cuentas y órdenes y mostrar los resultados. También permite restablecer el campo de búsqueda.

    Componente de Creación de Cuentas: Permite crear una nueva cuenta en Salesforce proporcionando los detalles requeridos.

    Componente de Creación de Órdenes: Permite crear una nueva orden en Salesforce con varios campos y validaciones.

    Componente de Creación de Contactos: Permite crear un nuevo contacto relacionado con una cuenta existente o nueva.

# Tecnologías Utilizadas
    Salesforce Lightning Web Components (LWC): Para crear componentes interactivos y dinámicos.
    Apex: Para interactuar con los datos en Salesforce y realizar operaciones como la búsqueda y creación de registros.
    Lightning Design System (LDS): Para aplicar estilos y elementos de diseño de Salesforce.
    Platform Events & ShowToastEvent: Para mostrar notificaciones de éxito o error.

# Instalación
    Clona el repositorio del proyecto a tu entorno de desarrollo Salesforce.

    Implementa los componentes en tu organización Salesforce.

    Asegúrate de tener configurados los métodos Apex searchAccounts, searchOrders, createOrder, createContact, etc., en el backend de Salesforce.

    Usa los componentes de LWC dentro de las páginas de Salesforce para acceder a sus funcionalidades.

# Ejemplo de Uso
    Búsqueda de Cuentas y Órdenes
    Ingresa un término de búsqueda en el campo de entrada de búsqueda (por ejemplo, nombre de cuenta o número de orden).
    Verás los resultados en las tarjetas de "Resultados de Cuentas" o "Resultados de Órdenes".
    Haz clic en el ID de cuenta o número de orden para abrir la vista detallada en una nueva pestaña.

# Creación de una Cuenta
    Completa los campos de "Nombre de Cuenta", "Teléfono" y "Sitio Web".
    Haz clic en el botón "Crear" para guardar la nueva cuenta.
    Si los datos son válidos, la cuenta se creará correctamente y se mostrará una notificación de éxito.

# Creación de una Orden
    Completa los campos como "Nombre de la Orden", "Fecha de Inicio", "Gestión", "SubGestión", "Método de Entrega" e "ID de Cuenta".
    Haz clic en el botón "Crear Orden" para guardar la nueva orden.
    Recibirás una notificación de éxito si la orden se crea correctamente.

# Creación de un Contacto
    Completa los campos de "Nombre", "Apellido", "Correo Electrónico", "Teléfono" y "ID de Cuenta".
    Haz clic en "Crear" para guardar el nuevo contacto.
    La creación del contacto se notificará con un mensaje de éxito.

# Contribuciones
# Si deseas contribuir a este proyecto, por favor sigue estos pasos:

    Haz un fork del repositorio.
    Crea una nueva rama para tu contribución.
    Realiza los cambios y asegúrate de que todo funcione correctamente.
    Envía un pull request con una descripción de los cambios.

# Salesforce DX Project: Next Steps

Now that you’ve created a Salesforce DX project, what’s next? Here are some documentation resources to get you started.

## How Do You Plan to Deploy Your Changes?

Do you want to deploy a set of changes, or create a self-contained application? Choose a [development model](https://developer.salesforce.com/tools/vscode/en/user-guide/development-models).

## Configure Your Salesforce DX Project

The `sfdx-project.json` file contains useful configuration information for your project. See [Salesforce DX Project Configuration](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_ws_config.htm) in the _Salesforce DX Developer Guide_ for details about this file.

## Read All About It

- [Salesforce Extensions Documentation](https://developer.salesforce.com/tools/vscode/)
- [Salesforce CLI Setup Guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_setup.meta/sfdx_setup/sfdx_setup_intro.htm)
- [Salesforce DX Developer Guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_intro.htm)
- [Salesforce CLI Command Reference](https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_reference.meta/sfdx_cli_reference/cli_reference.htm)
