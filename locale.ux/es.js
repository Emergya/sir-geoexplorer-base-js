GeoExt.Lang.add(
    'es', {

    /* A\u00f1adir capas */
    'gxp.plugins.AddLayers.prototype': {
        addActionMenuText: 'A\u00F1adir Capas',
        addActionTip: 'Herramientas para importar capas de diferentes formatos',
        addServerText: 'A\u00F1adir servidor',
        addButtonText: 'A\u00F1adir Capas',
        untitledText: 'Sin T\u00EDtulo',
        addLayerSourceErrorText: 'Error obteniendo capabilities de WMS ({msg}).\nPor favor, compruebe la URL y vuelva a intentarlo.',
        availableLayersText: 'Capas disponibles',
        expanderTemplateText: '<p><b>Resumen:</b> {abstract}</p>',
        panelTitleText: 'T\u00EDtulo',
        layerSelectionText: 'Ver datos disponibles de:',
        doneText: 'Hecho',
        uploadText: 'Subir Datos'
    },

    'Viewer.plugins.AddLayers.prototype': {
        nameHeaderText: 'Nombre',
        titleHeaderText: 'T\u00EDtulo',
        queryableHeaderText: 'Consultable',
        layerSelectionLabel: 'Ver datos disponibles de:',
        layerAdditionLabel: 'o a\u00F1adir otro servidor.',
        previewLayerText: "Vista previa de la capa '{0}'",
        expanderTemplateText: '<p><b>Resumen:</b> {abstract}</p>',
        folderSaved: 'Capa guardada',
        folderSavedText: 'La capa %s% ha sido guardada correctamente.',
        folderCancel: 'Aviso',
        folderCancelText: 'Error al guardar la capa. Int\u00e9ntelo de nuevo.',
        addActionMenuText: 'A\u00F1adir Capas',
        addActionTip: 'A\u00f1adir Capas',
        addServerText: 'A\u00f1adir servidor',
        addButtonText: 'A\u00f1adir Capas',
        untitledText: 'Sin T\u00EDtulo',
        addLayerSourceErrorText: 'Error obteniendo capabilities de WMS ({msg}).\nPor favor, compruebe la URL y vuelva a intentarlo.',
        availableLayersText: 'Capas disponibles',
        panelTitleText: 'T\u00EDtulo',
        panelIdText: 'Nombre',
        panelAbstractText: 'Descripci\u00F3n',
        panelSRSText: 'Projecci\u00F3n',
        layerSelectionText: 'Ver datos disponibles de:',
        doneText: 'Hecho',
        uploadText: 'Subir capas',
        onlyCompatibleText: 'S\u00f3lo compatibles',
        makePersistentText: '\u00bfDesea hacerla persistente?',
        uploadKMLText: 'Subir un KML...',
        uploadRasterText: 'Subir un Raster...',
        uploadShapeText: 'Subir archivo ZIP con SHP...',
        uploadXlsText: 'Subir archivo XLS con coordenadas...',
        uploadKmlImportText: 'Subir archivo KML...',
        invalidWMSURLText: 'Escriba una URL válida de un servidor WMS (p. ej. http://example.com/geoserver/wms)',
        addWMSLayerActionText: 'Capas WMS...',
        temporaryLayerActionText: 'Capa Temporal...',
        addWFSLayerActionText: 'WFS...',
        findActionMenuText: 'Buscar capas...',
        tempLayerWindowTitleText: 'Crear capa temporal',
        tempLayerPointText: 'Punto',
        tempLayerLineText: 'Línea',
        tempLayerPolygonText: 'Polígono',
        tempLayerNameLabelText: 'Nombre',
        tempLayerCreateButtonText: 'Crear',
        tempLayerCancelButtonText: 'Cancelar',
        tempLayerDescriptionText: 'Crea una capa temporal del tipo de geometría indicado.',
        removeText: 'Borrar',
        removeTitleText: 'Borra el servidor para todos los usuarios de la plataforma',
        removeSourceWindowTitleText: 'Aviso: Borrar servidor',
        removeSourceWindowText: "¿Desea borrar el servidor'{0}' (id = {1}) para todos los usuarios de la plataforma?",
        nameBlankText: 'El nombre de capa no puede estar vacío',
        waitText: 'Por favor, espere...'
    },

    'OpenLayers.Control.LoadLayerWizard.prototype': {
        loadText: 'Cargar',
        uploadingText: 'Cargando...',
        emptyText: 'Seleccione un {0}',
        layerLoadedTitleText: '\u00E9xito',
        layerLoadedText: 'La capa {0} se ha cargado',
        inProjectionText: 'Proyecci\u00F3n',
        selectFileText: 'Selecciona el fichero {0} a cargar',
        titleWindowLocationLayer: 'Introduce el nombre de la capa y el de su carpeta padre',
        labelLayerName: 'Nombre de la capa',
        labelLayerParentFolderName: 'Selecciona la carpeta',
        selectNameText: 'Introduce el nombre de la capa',
        selectComboBoxText: 'Selecciona la carpeta donde guardar la capa',
        buttonFormLayer: 'Guardar',
        nameFolderUser: 'Carpeta del usuario',
        rootFolderNameUserText: 'Carpetas del usuario {0}',
        rootFolderNameGroupText: 'Carpetas del grupo {0}'
    },

    'Viewer.view.search.QueryPanel.prototype': {
        maxFeaturesText: 'L\u00EDmite de resultados',
        searchWFSDefaultStateText: "Pulsa en 'Consultar' para realizar la petici\u00F3n",
        searchWFSNotFoundStateText: 'No se han encontrado elementos con los criterios indicados',
        searchWFSFoundsStateText: "<ul><li>Se han encontrado {0} elementos</li><li>Se han volcado en la capa '{1}'</li></ul>",
        errorWFSText: "El servicio WFS de SIGESCAT no est\u00E1 disponible. <a href='#' id='error_msg_wfs_detail'\">Informaci00F3n t\u00e9cnica</a>",
        errorWFSDetailsTitleText: 'Detalles',
        queryText: 'Consultar',
        searcherTitleText: 'Buscador',
        searchButtonWFSButtonText: 'WFS',
        searchButtonWFSButtonTooltipText: 'B\u00FAsqueda en capas WFS configuradas',
        layerResultNameText: 'Resultado de consulta WFS'
    },

    'Viewer.view.map.MapToolbar.prototype': {
        searchButtonWFSButtonText: 'WFS',
        searchButtonWFSButtonTooltipText: 'B\u00FAsqueda en capas WFS configuradas'
    },

    'Ext.ux.StatusBar.prototype': {
        busyText: 'Cargando...'
    },

    'Viewer.widgets.SaveLayerPanel.prototype': {
        title: 'Hacer permanente',
        titleWindowLocationLayer: 'Introduzca el nombre de la capa a publicar',
        labelLayerName: 'Nombre de la capa',
        labelLayerParentFolderName: 'Seleccionar carpeta',
        selectNameText: 'Introduzca el nombre de la capa',
        selectComboBoxText: 'Seleccione la carpeta en la que quiere guardar la capa',
        buttonFormLayer: 'Hacer permanente',
        nameFolderUser: 'Carpeta de usuario',
        selectFileText: 'Seleccione un fichero {0} a cargar',
        uploadingText: 'Subiendo...',
        emptyText: 'Seleccione un {0}',
        layerLoadedTitleText: 'Correcto',
        layerLoadedText: 'La capa {0} se ha cargado',
        inProjectionText: 'Proyeci\u00F3n del fichero',
        loadText: 'Cargar',
        saveLayerTitleText: 'Capa a\u00F1adida',
        saveLayerText: "La capa '{0}' se ha a\u00F1adido de forma permanente.",
        saveLayerErrorTitleText: 'Se ha producido un error',
        saveLayerErrorText: 'Se ha producido un error al salvar la capa «{0}». <br><br>Por favor, contacte con su administrador',
        labelLayerMaxFeatures: 'M\u00e1ximas figuras',
        selectMaxFeature: 'Introduzca el n\u00famero m\u00e1ximo de figuras a mostrar',
        cancelText: 'Cancelar'
    },

    'Viewer.widgets.WMSLayerPanelMod.prototype': {
        notLoggedSaveTitleText: 'Sin logar',
        notLoggedSaveText: 'Necesitas logarte para activar esta opci\u00f3n'
    },

    'Viewer.plugins.KMLWizard.prototype': {
        windowTitleText: 'Crear nueva capa a partir de KML',
        fileEmptyText: 'Seleccione un archivo KML',
        layerNameEmptyText: 'Escriba un nombre para la capa',
        buttonNextText: 'Siguiente',
        layerNameLabelText: 'Nombre de la capa',
        fileLabelText: 'Achivo KML',
        chooseFileText: 'Examinar...',
        waitTitleMsgText: 'Subida de archivo',
        createLayerWaitMsgText: 'Creando capa a partir del archivo KML. Por favor espere.',
        createLayerWaitMsgTitleText: 'Procesando KML',
        fieldNameEmptyText: 'Escriba un nombre para el campo (letras, números, . y _)',
        descriptionTextKML: 'Escriba el nombre para la nueva capa y seleccione un archivo KML para subir.',
        descriptionTextXLS1: 'Escriba el nombre para la nueva capa y seleccione un archivo XLS para subir.',
        descriptionTextXLS2: 'Seleccione el sistema de referencia y las columnas en las que se almacenan las coordenadas X e Y dentro del fichero.'
    },

    'Viewer.plugins.XLSWizard.prototype': {
        windowTitleText: 'Crear nueva capa a partir de XLS',
        fileEmptyText: 'Seleccione un archivo XLS',
        layerNameEmptyText: 'Escriba un nombre para la capa',
        projectionNameEmpty: 'ID del Sistema de Referencia de Coordenadas',
        buttonNextText: 'Siguiente',
        layerNameLabelText: 'Nombre de la capa',
        fileLabelText: 'Achivo XLS',
        chooseFileText: 'Examinar...',
        uploadWaitMsgText: 'Enviando archivo. Por favor espere.',
        waitTitleMsgText: 'Subida de archivo',
        createLayerWaitMsgText: 'Procesando archivo XLS. Por favor espere.',
        createLayerWaitMsgTitleText: 'Procesando XLS',
        fieldNameEmptyText: 'Escriba un nombre para el campo (letras, números, . y _)',
        projectionLabel: 'CRS ',
        coordinateXLabel: 'Coordenada X ',
        coordinateYLabel: 'Coordenada Y ',
        columsEmpty: '* Las columnas con cabecera vacía no serán importadas.',
        descriptionTextXLS1: 'Escriba el nombre para la nueva capa y seleccione un archivo XLS para subir.',
        descriptionTextXLS2: 'Seleccione el sistema de referencia y las columnas en las que se almacenan las coordenadas X e Y dentro del fichero.'
    },

    'Viewer.plugins.RasterUploadPanel.prototype': {
        windowTitleText: 'Crear una nueva capa a partir de un fichero raster',
        descriptionText: 'Escriba el nombre para la nueva capa, seleccione o ' + 
            'escriba el sistema de referencia del r\u00e1ster y seleccione un archivo GeoTIFF ' +
            'o un ZIP con un archivo imagen y un archivo world dentro del mismo.' + 
            ' (png+pngw, jpg+jpgw, tif+tifw).<br/>' + 
            'El tamaño máximo permitido del archivo seleccionado es de 10 MB.',
        fileTypeLabelText: 'Formato de la imagen',
        fileTypeEmptyText: 'Seleccione el formato de la imagen',
        buttonText: 'Subir',
        layerNameLabelText: 'Nombre',
        layerNameEmptyText: 'Nombre de la capa',
        fileLabel: 'Archivo raster',
        fileLabelText: 'Archivo con los datos de la capa raster',
        fileEmptyText: 'Buscador para el archivo raster...',
        chooseFileText: 'Buscar',
        titleLabel: 'Nombre',
        titleEmptyText: 'Nombre de la capa',
        abstractLabel: 'Descripci\u00f3n',
        abstractEmptyText: 'Descripci\u00f3n de la capa',
        createLayerWaitMsgText: 'Enviando archivo. Por favor espere.',
        createLayerWaitMsgTitleText: 'Subida de archivo',
        errorMsgTitle: 'Error',
        errorMsg: 'Ha habido un error al enviar los datos al servidor',
        invalidFileExtensionText: 'La extensi\u00f3n del archivo debe ser una de: ',
        crsEmptyText: 'ID del Sistema de Referencia de Coordenadas',
        crsTooltipText: 'Sistema de Coordenadas de Referencia (<i>Coordinate ' +
            'Reference System</i>). Es la proyección utilizada por los datos.',
        invalidCrsText: 'El identificador CRS debe ser un c\u00f3digo EPSG (ej. EPSG:4326)'
    },

    'Viewer.plugins.ExportToSHP.prototype': {
        exportToSHPText: 'Exportar a SHP',
        exportToSHPTooltipText: 'Exportar capa a un fichero shape',
        exportToSHPMsg: 'Generando el fichero ZIP ...',
        exportToSHPErrorTitle: 'Error',
        exportToSHPErrorContent: 'Error al exportar la capa'
    },

    'Viewer.plugins.ExportToKML.prototype': {
        exportToKMLText: 'Exportar a KML',
        exportToKMLTooltipText: 'Exportar capa a un fichero kml',
        exportToKMLMsg: 'Generando el fichero KML ...',
        exportToKMLErrorTitle: 'Error',
        exportToKMLErrorContent: 'Error al exportar la capa'
    },

    'PersistenceGeo.Context.prototype': {
        defaultAuthGroup: "Capas de '{0}'",
        defaultUsersGroup: "Capas del usuario '{0}'",
        channelGroupText: "Capas del canal '{0}'",
        publicLayersGroupText: 'Capas p\u00fablicas',
        publishRequestsGroupText: 'Solicitudes de publicaci\u00f3n'
    },

    'PersistenceGeo.tree.MakeLayerPersistent.prototype': {
        makePersistentText: 'Hacer capa persistente',
        makePersistentTooltipText: 'Hacer capa persistente en la instituci\u00f3n a la que pertenece el usuario logado'
    },

    'gxp.plugins.QueryForm.prototype': {
        queryActionText: 'Filtrado y consulta',
        queryMenuText: 'Consultar capa',
        queryActionTip: 'Abre el panel de consultas por criterios alfanum\u00e9ricos en el que se puede ir incluyendo diversos criterios sobre los campos de la capa seleccionada',
        queryByLocationText: 'Consultar en la extensi\u00f3n actual',
        queryByAttributesText: 'Consultar por atributos',
        queryMsg: 'Consultando...',
        cancelButtonText: 'Cancelar',
        noFeaturesTitle: 'Sin coincidencias',
        noFeaturesMessage: 'Su consulta no produjo resultados.'
    },

    'Viewer.dialog.ChannelTools.prototype': {
        titleText: 'Canales Tem\u00e1ticos',
        loadText: 'Cargar',
        closeText: 'Cerrar',
        folderWindowTitleText: 'Carpetas'
    },

    'Viewer.widgets.ChannelToolsLayersTree.prototype': {
        channelsNodeText: 'Generales',
        zonesNodeText: 'Municipios'
    },

    'gxp.plugins.ChannelToolsAction.prototype': {
        buttonText: 'Canales Tem\u00e1ticos',
        menuText: 'Canales Tem\u00e1ticos',
        tooltip: 'Muestra una ventana con una lista de canales tem\u00e1ticos que cargan una serie de capas de una tem\u00e1tica determinada en el \u00e1rbol de capas.'
    },

    'gxp.plugins.AddTagToMap.prototype': {
        addTagToMapTooltipText: 'A\u00f1adir etiqueta al mapa',
        titlePrompt: 'Escriba',
        promptText: 'Introduzca el nombre de la etiqueta',
        labelTitleLayer: 'Capa de Etiquetas'
    },
    'gxp.plugins.MetadataInformation.prototype': {
        menuText: 'Mostrar metadatos de la capa seleccionada',
        tooltip: 'Mostrar metadatos de la capa seleccionada',
        windowTitle: 'Metadatos de la capa',
        windowLoadingMsg: 'Cargando...'
    },

    'Viewer.dialog.ChartWindow.prototype': {
        title: 'Iniciativas de Inversi\u00f3n',
        topTitleText: 'CRITERIOS DE B\u00daSQUEDA',
        stageText: 'Financiamiento',
        yearText: 'A\u00f1o',
        sourceText: 'Fuente',
        financingLineText: 'L\u00ednea Financiera',
        sectorText: 'Sector',
        territorialLevelText: 'Nivel Territorial',
        groupByText: 'Agrupar por',
        proyectosPreinversionText: 'Gobierno Regional',
        proyectosEjecucionText: 'Servicios P\u00fablicos',
        graphicButtonText: 'Graficar',
        centerTitleText: 'Gr\u00e1fico',
        eastTitleText: 'Gr\u00e1fico',
        xAxisTitle: 'Monto (M$)',
        porcionOtrosText: 'Otros',
        geoButtonText: 'Buscar Iniciativas Georreferenciadas',
        exchangeChartsText: 'Intercambiar'
    },

    /** Herramientas de la barra de Herramientas principal **/
    /* Imprimir en pdf */
    'gxp.plugins.PDFPrintAction.prototype': {
        buttonText: 'Imprimir',
        menuText: 'Imprimir',
        tooltip: 'Herramienta de impresi\u00f3n de la vista actual del mapa',
        errorText: 'Ocurri\u00f3 un error, vuelva a intentarlo en unos instantes.',
        googleBaseLayerConfirmationText:"<p>La capa base seleccionada usa imágenes de Google, por lo que no es posible incluirla en la salida generada ya que se infringirían los términos de servicio (vea <a href=\"https://developers.google.com/maps/faq#tos_tiles\">este enlace</a> para más información), por lo que un rectángulo en blanco aparecerá bajo las capas seleccionadas.</p><p>Para mejores resultados elija otra capa base.</p>",
        continueAndUseGoogleBaseLayerText: "Continuar de todos modos",
        cancelText: "Cancelar"
    },
    /* Vista inicial */
    'gxp.plugins.ZoomToInitialValues.prototype': {
        tooltip: 'Vista inicial: volver al zoom inicial del mapa'
    },
    /* Acercar/Alejar (Zoom in/out) */
    'gxp.plugins.Zoom.prototype': {
        zoomInMenuText: 'Zoom m\u00e1s',
        zoomOutMenuText: 'Zoom menos',
        zoomTooltip: "Acercar dibujando un recudado",
        zoomInTooltip: 'Acercar el zoom del mapa',
        zoomOutTooltip: 'Alejar el zoom del mapa'
    },
    /* Vista anterior/siguiente */
    'gxp.plugins.NavigationHistory.prototype': {
        previousMenuText: 'Vista anterior',
        nextMenuText: 'Vista siguiente',
        previousTooltip: 'Vista anterior: vuelve al encuadre anterior del mapa',
        nextTooltip: 'Vista siguiente: vuelve al encuandre anterior al uso de vista anterior'
    },
    /* Paneo */
    'gxp.plugins.PanControlAction.prototype': {
        tooltip: 'Movimiento'
    },
    /* Barra de herramientas de informacion, edicion y exportar */
    'GeoExplorer.Composer.prototype': {
        /* Informaci\u00f3n */
        tooltipInfo: 'Herramientas de informaci\u00f3n',
        /* Edici\u00f3n */
        tooltipEdition: 'Herramientas de edici\u00f3n',
        /* Exportar */
        tooltipExport: 'Herramientas de exportaci\u00f3n',
        /* Informaci\u00f3n de elementos */
        tooltipGetFeatureInfo: 'Herramienta de informaci\u00f3n de los elementos de una capa',
        mapText: 'Mapa',
        saveMapText: 'Guardar map',
        exportMapText: 'Exportar map',
        toolsTitle: 'Cambiar herramientas de la barra de herramientas:',
        previewText: 'Vista previa',
        backText: 'Atr\u00e1s',
        nextText: 'Siguiente',
        loginText: 'Login',
        logoutText: 'Salir',
        loginErrorText: 'Contrase\u00f1a o nombre de usuario incorrecto.',
        userFieldText: 'Usuario',
        passwordFieldText: 'Contrase\u00f1a',
        saveErrorText: 'Error al salvar: ',
        tableText: 'Datos',
        queryText: 'Consultar'
    },

    /* Certificados municipales */
    'gxp.plugins.LocalCertificatesAction.prototype': {
        selectInMapText: 'Seleccionar en el mapa',
        searchFormText: 'Formulario de b\u00fasqueda...',
        selectPropertyInMapText: 'Por favor, seleccione una propiedad en el mapa.',
        noParcelSelectedText: "No se seleccion\u00f3 ninguna parcela, por favor pulse 'Seleccionar en mapa' de nuevo.",
        errorText: 'Ocurri\u00f3 un error, vuelva a intentarlo en unos instantes.',
        waitText: 'Por favor espere...',
        tooltip: 'Herramientas para emitir certificados municipales'
    },

    /* Instrumentos de planificaci\u00f3n */
    'gxp.plugins.PlanificationToolsAction.prototype': {
        tooltip: 'Instrumentos de planificaci\u00f3n territorial'
    },
    /* Iniciativas de inversi\u00f3n*/
    'Viewer.plugins.ChartWindowAction.prototype': {
        tooltip: 'Abre la ventana que muestra las Iniciativas de Inversi\u00f3n'
    },
    /* Log in/out */
    //TODO

    /** Barra de herramientas de informaci\u00f3n **/
    'Viewer.widgets.InformationToolbar.prototype': {
        /* B\u00fasquedas predeterminadas */
        tooltipDefaultSearches: 'Abre un cuadro de di\u00e1logo en el que se permiten realizar b\u00fasquedas predetermindas',
        /* Medir longitud */
        tooltipLengthMeasure: 'Permite obtener la longitud de  una l\u00ednea en el mapa, selecionándola o dibujándola',
        /* Medir \u00e1rea */
        tooltipAreaMeasure: 'Permite obtener el área de un polígono, selecionándolo o dibujándolo',
        /* Consultar la capa seleccionada */
        tooltipQueryLayer: 'Permite realizar una consulta sobre la capa seleccionada',
        /* Consultar coordenadas */
        tooltipPointInformation: 'Muestra informaci\u00f3n sobre las coordenadas seleccionadas',
        /* Consultar metadatos */
        tooltipMetadataLayer: 'Muestra informaci\u00f3n de los metadatos de la capa seleccionada.'
    },
    /** Barra de herramientas de edici\u00f3n **/
    'Viewer.widgets.EditionToolbar.prototype': {
        /* Selecci\u00f3n de elementos */
        tooltipSelectFeature: 'Permite seleccionar un elemento en el mapa',
        /* A\u00f1adir etiqueta */
        tooltipAddTag: 'Permite a\u00f1adir una etiqueta en el mapa',
        /* A\u00f1adir punto */
        tooltipAddPoint: 'Permite a\u00f1adir un punto a una capa de puntos',
        /* A\u00f1adir l\u00ednea */
        tooltipAddLine: 'Permite a\u00f1adir una l\u00ednea a una capa de l\u00edneas',
        /* A\u00f1adir pol\u00edgono */
        tooltipAddPolygon: 'Permite a\u00f1adir un pol\u00edgono a una capa de pol\u00edgonos',
        /* Crear bufer */
        tooltipAddBuffer: 'Permite crear un bufer sobre un elemente del mapa',
        /* Crear nuevo elemento */
        tooltipAddNewElement: 'Permite crear un nuevo elemento sobre una capa',
        /* Añadir columna a la capa seleccionada */
        tooltipAddColumn: 'Añadir columna a la capa seleccionada.',
        /* Eliminar columna de la capa seleccionada */
        tooltipDeleteColumn: 'Eliminar columna de la capa seleccionada.'
    },
    /** Barra de herramientas de exportaci\u00f3n **/
    'Viewer.widgets.ImportExportToolbar.prototype': {
        /* Exportar KML */
        tooltipExportKML: 'Permite exportar una capa a formato KML',
        /* Exportar SHP */
        tooltipExportSHP: 'Permite exportar una capa a formato SHP'
    },

    'Viewer.dialog.PDFPrintWindow.prototype': {
        printText: 'Imprimir',
        downloadImageText: 'Descargar imagen',
        sizeText: 'Tama\u00f1o',
        resolutionText: 'Resoluci\u00f3n',
        gridText: 'Grilla',
        legendText: 'Leyenda',
        logoText: 'Logotipo',
        browseText: 'Examinar',
        textText: 'Texto',
        titleText: 'T\u00edtulo',
        fontText: 'Fuente',
        descriptionText: 'Descripci\u00f3n',
        northArrowText: 'Flecha de norte',
        waitText: 'Por favor espere...',
        closeText: 'Cerrar',
        logoFileTypeUnsupportedText: 'Los tipos de imagen soportados son PNG y JPEG',
        errorText: 'Ocurri\u00f3 un error, vuelva a intentarlo en unos instantes.'
    },

    'Viewer.dialog.LocalCertificatesWindow.prototype': {
        titleText: 'Certificados Municipales',
        printText: 'Imprimir',
        viewText: 'Ver',
        closeText: 'Cerrar',
        searchText: 'Buscar',
        ownerHeaderText: 'Propietario',
        roleHeaderText: 'Rol',
        predioHeaderText: 'Predio',
        noSearchResultsText: "No hay datos para mostrar, pruebe a cambiar el filtro y pulsar 'Buscar'",
        waitText: 'Por favor espere...',
        errorText: 'Ocurri\u00f3 un error, vuelva a intentarlo en unos instantes.',
        selectInMapText: 'Seleccionar en el mapa'
    },


    'gxp.plugins.WMSGetFeatureInfo.prototype': {
        infoActionTip: 'Informaci\u00f3n del elemento',
        popupTitle: 'Informaci\u00f3n del elemento',
        buttonText: 'Identificar'
    },


    'Viewer.PointSymbolizerMod.prototype': {
        uploadFileEmptyText: 'Selecciona un icono...',
        uploadFileLabel: 'Icono',
        waitMsgText: 'Espere...'
    },

    'gxp.plugins.LayerTree.prototype': {
        overlayNodeText: 'Capas',
        baseNodeText: 'Capa base'
    },
    'gxp.plugins.LoadAdditionalLayersAction.prototype': {
        menuText: 'Ver m\u00e1s',
        buttonText: 'Ver m\u00e1s',
        tooltip: 'Abre una ventana en la que puede seleccionar capas adicionales para visualizar en el visor.'

    },
    'Viewer.dialog.PointInformation.prototype': {
        descriptionText: 'Haga click en el mapa para ver las coordenadas del lugar pulsado.'
    },
    'Ext.form.TextField.prototype': {
        blankText: 'Este campo no puede estar vac\u00edo',
        minLengthText: 'La longitud m\u00ednima de este campo es {0}',
        maxLengthText: 'La longitud m\u00e1xima de este campo es {0}'

    },

    'PersistenceGeo.Parser.prototype': {
        loadingText: 'Por favor, espere...'
    },

    'Viewer.dialog.DefaultSearches.prototype': {
        titleTool: 'Búsquedas Predeterminadas'
    },

    'gxp.FeatureEditPopup.prototype': {
        title: 'Establecer campos',
        cls: 'featureEditorPopup'
    },

    'Ext.grid.PropertyColumnModel.prototype': {
        nameText: 'Campo',
        valueText: 'Valor',
        dateFormat: 'dd/MM/yy'
    },

    'gxp.plugins.FeatureEditor.propertyEditor.prototype': {
        exceptionTitle: 'Fallo al guardar'
    },

    'Ext.MessageBox': {
        buttonText: {
            yes: 'Sí',
            no: 'No',
            cancel: 'Cancelar',
            ok: 'Aceptar'
        }
    },

    'Viewer.dialog.NewElementFromCoords.prototype': {
        addPointText: 'Añadir Punto',
        geometryLabels: {
            'Point': 'Introduzca los puntos a añadir a la capa seleccionada:',
            'Line': 'Introduzca los vértices de la línea a añadir a la capa seleccionada:',
            'Polygon': 'Introduzca los vértices del polígono a añadir a la capa seleccionada:'
        },
        latText: 'Latitud',
        lonText: 'Longitud',
        saveTitleText: '¿Guardar cambios en la capa?',
        saveChangesText: 'Guardar cambios',
        discardChangesText: 'Descartar cambios',
        cancelText: 'Cancelar',
        saveMsgText: 'La capa activa tiene cambios sin guardar, ¿Desea guardarlos ahora?',
        waitText: 'Por favor, espere...',
        saveErrorText: 'Hubo un problema al guardar el nuevo elemento, pruebe de nuevo en unos instantes.',
        saveSuccessText: 'El nuevo elemento se añadió con éxito a la capa.',
        removeText: 'Eliminar'
    },

    'Viewer.dialog.AddDataColumn.prototype': {
        columnNameEmptyText: 'Introduzca un nombre para la nueva columna a crear en la capa seleccionada.',
        buttonSaveText: 'Guardar',
        columnNameLabelText: 'Nombre de la columna',
        createColumnWaitMsgText: 'Creando columna. Por favor espere.',
        createColumnWaitMsgTitleText: 'Procesando...',
        fieldNameEmptyText: 'Escriba un nombre para el campo (letras, números, . y _)',
        descriptionTextColumn: 'Introduzca un nombre para la nueva columna.',
        columnTypeEmpty: 'Introduzca tipo de dato',
        columnTypeLabel: 'Tipo de dato',
        typeString: 'String',
        typeNumber: 'Number',
        typeDate: 'Date',
        newColumnTitle: 'Nueva volumna'
    },

    'Viewer.dialog.DeleteDataColumn.prototype': {
        descriptionTextColumn: 'Seleccione las columnas que desea eliminar y pulse el botón Guardar.',
        columnNameLabelText: 'Columnas disponibles',
        deleteColumnWaitMsgText: 'Eliminar columnas.',
        loadingDataText: 'Cargando datos. Por favor espere.',
        deleteColumnWaitMsgTitleText: 'Procesando...',
        deleteColumnTitle: 'Eliminar columnas.',
        buttonSaveText: 'Guardar'
    },

    'Viewer.plugins.WMSStylesDialogMod.prototype': {
        updateDefaultStyleText: 'Guardar',
        updateDefaultTip: 'Establece el estilo seleccionado como estilo por defecto al visualizar la capa'
    },

    'gxp.FilterBuilder.prototype': {
        addConditionText: 'Añadir condición',
        addGroupText: 'Añadir grupo',
        removeConditionText: 'Quitar condición',
        postComboText: 'las condiciones:'
    },

    'gxp.form.ComparisonComboBox.prototype': {
        allowedTypes: [
            [OpenLayers.Filter.Comparison.EQUAL_TO, 'igual a'],
            [OpenLayers.Filter.Comparison.NOT_EQUAL_TO, 'distinto a'],
            [OpenLayers.Filter.Comparison.LESS_THAN, 'menor que'],
            [OpenLayers.Filter.Comparison.GREATER_THAN, 'mayor que'],
            [OpenLayers.Filter.Comparison.LESS_THAN_OR_EQUAL_TO, 'menor o igual que'],
            [OpenLayers.Filter.Comparison.GREATER_THAN_OR_EQUAL_TO, 'mayor o igual que'],
            [OpenLayers.Filter.Comparison.LIKE, 'similar a '],
            [OpenLayers.Filter.Comparison.BETWEEN, 'entre']
        ]
    },

    'Viewer.widgets.QueryForm.prototype': {
        resultCountText: 'Se encontraron {0} resultados.'
    },

    'gxp.plugins.SelectFeatureAction.prototype': {
        waitText: 'Por favor espere...',
        errorText: 'Ocurrió un error, inténtelo de nuevo en unos instantes.'
    },

    'gxp.plugins.DeleteSelectedFeaturesAction.prototype': {
        buttonText: 'Borrar elementos seleccionados',
        menuText: 'Borrar elementos seleccionados',
        tooltip: 'Borrar elementos seleccionados',
        waitText: 'Por favor, espere...',
        errorText: 'Ocurrió un error. Por favor vuelva a intentarlo en unos instantes.',

        confirmQuestionText: 'Los elementos seleccionados se eliminarán permanentemente. ¿Desea continuar?',
        deleteText: 'Borrar elementos',
        cancelText: 'No borrar',
        successText: 'Los elementos fueron borrados con éxito.'
    },

    'Viewer.dialog.CreateBuffer.prototype': {
        waitText: 'Por favor, espere...',
        errorText: 'Se ha producido un error, inténtelo de nuevo en unos instantes.',
        confirmCreateText: 'Se creará una capa temporal con el buffer previsualizado. ¿Desea continuar?',
        createBufferLayerText: 'Crear capa con el buffer',
        dontCreateBufferLayerText: 'No crear capa',
        bufferLayerCreatedText: "Se creó el buffer en la nueva capa '{0}' con éxito.",
        invalidDistanceText: 'La distancia tiene que ser mayor que 0 y menor que 10.000.'
    },

    'gxp.plugins.AddFeatureToMap.prototype': {
        errorText: 'Ocurrió un error. Por favor pruebe de nuevo en unos instantes.',
        waitText: 'Por favor, espere...'
    },

    'Viewer.plugins.FeatureEditorAction.prototype': {
        errorText: 'Ocurrió un error. Por favor pruebe de nuevo en unos instantes.',
        waitText: 'Por favor, espere...'
    },

    'PersistenceGeo.widgets.NewSourceDialog.prototype': {
        storeAndAddServerText: 'Guardar',
        storeAndAddServerTitleText: 'A\u00F1ade el servidor y lo guarda para todos los usuarios de la plataforma',
        addServerText: 'A\u00F1adir',
        addServerTitleText: 'A\u00F1de el servidor para la sesi\u00f3n actual',
        cancelTitleText: 'Cierra la ventana sin a\u00F1adir el servidor',
        sourceNameTitleText: 'Nombre'
    },

    'gxp.plugins.CustomMeasure.prototype': {
        drawInMapText: 'Medir dibujando en el mapa',
        selectFeatureText: 'Seleccionar elemento a medir',
        numberFormat: '0.000,00/i',
        drawPopupTooltips: {
            'AREA': 'Área del polígono dibujado:',
            'LENGTH': 'Longitud de la polilínea dibujada:',
            'PERIMETER': 'Perímetro del polígono dibujado:'
        },
        selectionPopupTooltips: {
            'AREA': 'Área del polígono seleccionado:',
            'LENGTH': 'Longitud de la polilínea seleccionada:',
            'PERIMETER': 'Perímetro del polígono seleccionado:'
        }
    },

    'PersistenceGeo.tree.LayerOpacitySlider.prototype':{
        opacityText: 'Opacidad',
        opacityTooltipText: 'Cambia la opacidad de la capa',
        opacityWindowText: 'Opacidad de la capa <div class="pgeo_layeropacityslider-layerName">{0}</div>'
    },

    'PersistenceGeo.widgets.LoginWindow.prototype':{
        title: "Login",
        backText: "Volver",
        nextText: "Siguiente",
        loginText: "Login",
        logoutText: "Logout, {user}",
        loginErrorText: "Usuario o contrase\u00f1.a inv\u00e1lida",
        userFieldText: "Usuario",
        passwordFieldText: "Contras\u00f1a", 
        saveErrorText: "Error al salvar: ",
        loginUserErrorTitleText: 'Error de login!',
        loginUserErrorText: 'Usuario \'{0}\' desconocido.\n Por favor, compruebe su contrase\u00f1a o consulte con el administrador'
    },

    'Viewer.plugins.FichaInversion.prototype' : {
        waitText: "Por favor, espere...",
        errorText: "Ocurrió un error, pruebe de nuevo en unos instantes."
    }

});