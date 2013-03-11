GeoExt.Lang.add("es",{

    "gxp.plugins.AddLayers.prototype" : {
        addActionMenuText : "A\u00F1adir Capas",
        addActionTip : "A\u00F1adir Capas",
        addServerText : "A\u00F1adir servidor",
        addButtonText : "A\u00F1adir Capas",
        untitledText : "Sin T\u00EDtulo",
        addLayerSourceErrorText : "Error obteniendo capabilities de WMS ({msg}).\nPor favor, compruebe la URL y vuelva a intentarlo.",
        availableLayersText : "Capas disponibles",
        expanderTemplateText : "<p><b>Resumen:</b> {abstract}</p>",
        panelTitleText : "T\u00EDtulo",
        layerSelectionText : "Ver datos disponibles de:",
        doneText : "Hecho",
        uploadText : "Subir Datos"
    },

    "Viewer.plugins.AddLayers.prototype" : {
        nameHeaderText : "Nombre",
        titleHeaderText : "T\u00EDtulo",
        queryableHeaderText : "Consultable",
        layerSelectionLabel : "Ver datos disponibles de:",
        layerAdditionLabel : "o a\u00F1adir otro servidor.",
        previewLayerText : "Vista previa de la capa '{0}'",
        expanderTemplateText : "<p><b>Resumen:</b> {abstract}</p>",
        folderSaved: "Capa guardada",
        folderSavedText: "La capa %s% ha sido guardada correctamente.",
        folderCancel: "Aviso",
        folderCancelText: "Error al guardar la capa. Inténtelo de nuevo.",
        addActionMenuText : "A\u00F1adir Capas",
        addActionTip : "Añadir Capas",
        addServerText : "Añadir servidor",
        addButtonText : "Añadir Capas",
        untitledText : "Sin T\u00EDtulo",
        addLayerSourceErrorText : "Error obteniendo capabilities de WMS ({msg}).\nPor favor, compruebe la URL y vuelva a intentarlo.",
        availableLayersText : "Capas disponibles",
        expanderTemplateText : "<p><b>Resumen:</b> {abstract}</p>",
        panelTitleText : "T\u00EDtulo",
        panelIdText: "Nombre",
        panelAbstractText: "Descripci\u00F3n",
        panelSRSText: "Projecci\u00F3n",
        layerSelectionText : "Ver datos disponibles de:",
        doneText : "Hecho",
        uploadText : "Subir capas",
        onlyCompatibleText: "S\u00f3lo compatibles",
        makePersistentText: "¿Desea hacerla persistente?",
        uploadKMLText: "Subir un KML",
        uploadRasterText: "Subir un Raster",
        uploadShapeText: "Subir archivo ZIP con SHP"
    },

    "OpenLayers.Control.LoadLayerWizard.prototype" : {
        loadText : "Cargar",
        uploadingText: 'Cargando...',
        emptyText: 'Seleccione un {0}',
        layerLoadedTitleText: '\u00E9xito',
        layerLoadedText: 'La capa {0} se ha cargado',
        inProjectionText: "Proyecci\u00F3n",
        selectFileText : "Selecciona el fichero {0} a cargar",
        titleWindowLocationLayer: "Introduce el nombre de la capa y el de su carpeta padre",
        labelLayerName : "Nombre de la capa",
        labelLayerParentFolderName : "Selecciona la carpeta",
        selectNameText: "Introduce el nombre de la capa",
        selectComboBoxText : "Selecciona la carpeta donde guardar la capa",
        buttonFormLayer : "Guardar",
        nameFolderUser: "Carpeta del usuario",
        rootFolderNameUserText: "Carpetas del usuario {0}",
        rootFolderNameGroupText: "Carpetas del grupo {0}"
    },

    "Viewer.view.search.QueryPanel.prototype": {
        maxFeaturesText : "L\u00EDmite de resultados",
        searchWFSDefaultStateText : "Pulsa en 'Consultar' para realizar la petici\u00F3n",
        searchWFSNotFoundStateText : "No se han encontrado elementos con los criterios indicados",
        searchWFSFoundsStateText : "<ul><li>Se han encontrado {0} elementos</li><li>Se han volcado en la capa '{1}'</li></ul>",    
        errorWFSText: "El servicio WFS de SIGESCAT no est\u00E1 disponible. <a href='#' id='error_msg_wfs_detail'\">Informaci00F3n técnica</a>",
        errorWFSDetailsTitleText: "Detalles",
        queryText : "Consultar",
        searcherTitleText : "Buscador",
        searchButtonWFSButtonText : "WFS",
        searchButtonWFSButtonTooltipText : "B\u00FAsqueda en capas WFS configuradas",
        layerResultNameText: "Resultado de consulta WFS"
    },

    "Viewer.view.map.MapToolbar.prototype":{
        searchButtonWFSButtonText : "WFS",
        searchButtonWFSButtonTooltipText : "B\u00FAsqueda en capas WFS configuradas"
    },

    "Ext.ux.StatusBar.prototype":{
        busyText: "Cargando..."
    },

    "Viewer.widgets.SaveLayerPanel.prototype":{
        title: "Hacer permanente",
        titleWindowLocationLayer: "Introduzca el nombre de la capa a publicar",
        labelLayerName : "Nombre de la capa",
        labelLayerParentFolderName : "Seleccionar carpeta",
        selectNameText: "Introduzca el nombre de la capa",
        selectComboBoxText : "Seleccione la carpeta en la que quiere guardar la capa",
        buttonFormLayer : "Hacer permanente",
        nameFolderUser: "Carpeta de usuario",
        selectFileText : "Seleccione un fichero {0} a cargar",
        uploadingText : 'Subiendo...',
        emptyText : 'Seleccione un {0}',
        layerLoadedTitleText : 'Correcto',
        layerLoadedText : 'La capa {0} se ha cargado',
        inProjectionText : "Proyeci\u00F3n del fichero",
        loadText : "Cargar",
        saveLayerTitleText: "Capa a\u00F1adida", 
        saveLayerText: "La capa '{0}' se ha a\u00F1adido de formapermanente.",
        saveLayerErrorTitleText: "Se ha producido un error",
        saveLayerErrorText: "se ha producido un error al salvar la capa '{0}'. Por favor, contacte con su administrador",
        labelLayerMaxFeatures: "M\u00e1ximas figuras",
        selectMaxFeature: "Introduzca el n\u00famero m\u00e1ximo de figuras a mostrar",
        cancelText: "Cancelar"
    },

    "Viewer.widgets.WMSLayerPanelMod.prototype":{
        notLoggedSaveTitleText: "Sin logar",
        notLoggedSaveText: "Necesitas logarte para activar esta opci\u00f3n"
    },

    "Viewer.plugins.KMLUploadPanel.prototype":{
        titleLabel: "Nombre",
        titleEmptyText: "Nombre de la capa",
        makePersistentText: "¿Desea hacer persistente la capa KML '{0}'?"
    },

    "Viewer.plugins.RasterUploadPanel.prototype":{
        windowTitleText: "Crear una nueva capa a partir de un fichero raster",
        buttonText: "Subir",
        layerNameLabelText: "Nombre",
        layerNameEmptyText: "Nombre de la capa",
        fileLabel: "Archivo raster",
        fileLabelText: "Archivo con los datos de la capa raster",
        fileEmptyText: "Buscador para el archivo raster...",
        chooseFileText: "Buscar",
        titleLabel: "Nombre",
        titleEmptyText: "Nombre de la capa",
        abstractLabel: "Descripción",
        abstractEmptyText: "Descripción de la capa",
        createLayerWaitMsgText: "Enviando archivo. Por favor espere.",
        createLayerWaitMsgTitleText: "Subida de archivo",
        errorMsgTitle: "Error",
        errorMsg: "Ha habido un error al enviar los datos al servidor",
        invalidFileExtensionText: "La extensión del archivo debe ser una de: ",
        crsEmptyText: "ID del Sistema de Referencia de Coordenadas",
        invalidCrsText: "El identificador CRS debe ser un código EPSG (ej. EPSG:4326)"
    },

    "Viewer.plugins.ExportToSHP.prototype":{
        exportToSHPText: "Exportar a SHP",
        exportToSHPTooltipText: "Exportar capa a un fichero shape",
        exportToSHPMsg: "Generando el fichero ZIP ...",
        exportToSHPErrorTitle: "Error",
        exportToSHPErrorContent: "Error al exportar la capa"
    },

    "Viewer.plugins.ExportToKML.prototype":{
        exportToKMLText: "Exportar a KML",
        exportToKMLTooltipText: "Exportar capa a un fichero kml",
        exportToKMLMsg: "Generando el fichero KML ...",
        exportToKMLErrorTitle: "Error",
        exportToKMLErrorContent: "Error al exportar la capa"
    },

    "PersistenceGeo.Context.prototype":{
        defaultAuthGroup: "Capas de '{0}'",
        defaultUsersGroup: "Capas del usuario '{0}'",
        channelGroupText: "Capas del canal '{0}'"
    },

    "PersistenceGeo.tree.MakeLayerPersistent.prototype":{
        makePersistentText: "Hacer capa persistente",
        makePersistentTooltipText: "Hacer capa persistente en la instituci\u00f3n a la que pertenece el usuario logado"
    },

    "gxp.plugins.QueryForm.prototype": {
        queryActionText: "Filtrado y consulta",
        queryMenuText: "Consultar capa",
        queryActionTip: "Abre el panel de consultas por criterios alfanum\u00e9ricos en el que se puede ir incluyendo diversos criterios sobre los campos de la capa seleccionada",
        queryByLocationText: "Consultar en la extensi\u00f3n actual",
        queryByAttributesText: "Consultar por atributos",
        queryMsg: "Consultando...",
        cancelButtonText: "Cancelar",
        noFeaturesTitle: "Sin coincidencias",
        noFeaturesMessage: "Su consulta no produjo resultados."
    },

    "GeoExplorer.Composer.prototype": {
        mapText: "Mapa",
        saveMapText: "Guardar map",
        exportMapText: "Exportar map",
        toolsTitle: "Cambiar herramientas de la barra de herramientas:",
        previewText: "Vista previa",
        backText: "Atr\u00e1s",
        nextText: "Siguiente",
        loginText: "Login",
        logoutText: "Salir, {user}",
        loginErrorText: "Contrase\u00f1a o nombre de usuario incorrecto.",
        userFieldText: "Usuario",
        passwordFieldText: "Contrase\u00f1a",
        saveErrorText: "Error al salvar: ",
        tableText: "Datos",
        queryText: "Consultar"        
    },

    "Viewer.dialog.ChannelTools.prototype":{
        titleText: "Canales Temáticos",
        loadText: 'Cargar',
        closeText: 'Cerrar'
    },

    "Viewer.widgets.ChannelToolsLayersTree.prototype":{
        channelsNodeText: 'Generales',
        zonesNodeText: 'Municipios'
    },

    "gxp.plugins.ChannelToolsAction.prototype":{
        buttonText: 'Canales Temáticos',
        menuText: 'Canales Temáticos',
        tooltip: 'Cargar canales de capas'
    },
    
    

    "gxp.plugins.AddTagToMap.prototype":{
        addTagToMapTooltipText: "Añadir etiqueta al mapa",
        titlePrompt: "Escriba",
        promptText: "Introduzca el nombre de la etiqueta",
        labelTitleLayer: "Capa de Etiquetas"
    },
    "gxp.plugins.MetadataInformation.prototype":{
        menuText: "Mostrar metadatos de la capa seleccionada",
        tooltip: "Mostrar metadatos de la capa seleccionada",
        windowTitle: 'Metadatos de la capa',
        windowLoadingMsg: 'Cargando...'
    },

	"Viewer.dialog.ChartWindow.prototype": {
        title: "Iniciativas de Inversi\u00f3n",
        topTitleText: "CRITERIOS DE BÚSQUEDA",
        stageText: 'Etapa',
        yearText: 'Año',
        sourceText: 'Fuente',
        financingLineText: 'Línea Financiera',
        sectorText: "Sector",
        territorialLevelText: 'Nivel Territorial',
        groupByText: 'Agrupar por',
        proyectosPreinversionText: 'Preinversi\u00f3n',
        proyectosEjecucionText: 'Ejecuci\u00f3n PROPIR',
        graphicButtonText: 'Graficar',
        centerTitleText: 'Gráfico',
        eastTitleText: 'Gráfico',
        xAxisTitle: "Monto (M$)",
        porcionOtrosText: "Otros",
        geoButtonText: "Buscar Iniciativas Georreferenciadas"
    },

    "gxp.plugins.PDFPrintAction.prototype" : {
        buttonText:"Imprimir",
        menuText:"Imprimir",
        tooltip : "Imprimir",
        errorText:"Ocurrió un error, vuelva a intentarlo en unos instantes."
    },

    "Viewer.dialog.PDFPrintWindow.prototype" : {
        printText : 'Imprimir',   
        downloadImageText: "Descargar imagen",
        sizeText:"Tamaño",
        resolutionText:"Resolución",
        gridText:"Grilla",
        legendText: "Leyenda",
        logoText: "Logotipo",
        browseText: "Examinar",
        textText : "Texto",
        titleText: "Título",
        fontText: "Fuente",
        descriptionText: "Descripción",
        northArrowText: "Flecha de norte",
        waitText: "Por favor espere...",
        closeText: "Cerrar",
        logoFileTypeUnsupportedText: "Los tipos de imagen soportados son PNG y JPEG",
        errorText:"Ocurrió un error, vuelva a intentarlo en unos instantes."
    },

    "gxp.plugins.LocalCertificatesAction.prototype" : {
        selectInMapText:"Seleccionar en el mapa",
        searchFormText: "Formulario de búsqueda...",
        selectPropertyInMapText: "Por favor, seleccione una propiedad en el mapa.",
        noParcelSelectedText:"No se seleccionó ninguna parcela, por favor pulse 'Seleccionar en mapa' de nuevo.",
        errorText:"Ocurrió un error, vuelva a intentarlo en unos instantes.",
        waitText: "Por favor espere..."
    },
    
    "Viewer.dialog.LocalCertificatesWindow.prototype":{
    	titleText: "Certificados Municipales",
    	printText:"Imprimir",
    	viewText:"Ver",
    	closeText:"Cerrar",
    	searchText:"Buscar",
    	ownerHeaderText:"Propietario",
		roleHeaderText:"Rol",
		predioHeaderText:"Predio",
		noSearchResultsText:"No hay datos para mostrar, pruebe a cambiar el filtro y pulsar 'Buscar'",
		waitText: "Por favor espere...",
		errorText:"Ocurrió un error, vuelva a intentarlo en unos instantes.",
        selectInMapText:"Seleccionar en el mapa"        
    },

    "gxp.plugins.ZoomToInitialValues.prototype": {
        tooltip: 'Vista inicial'
    },

    "gxp.plugins.Zoom.prototype": {
        zoomInMenuText: "Zoom más",
        zoomOutMenuText: "Zoom menos",
        zoomInTooltip: "Zoom más",
        zoomOutTooltip: "Zoom menos"
    },

    "gxp.plugins.NavigationHistory.prototype": {
        previousMenuText: 'Vista anterior',
        nextMenuText: 'Vista siguiente',
        previousTooltip: 'Vista anterior',
        nextTooltip: 'Vista siguiente'
    },

    "gxp.plugins.WMSGetFeatureInfo.prototype": {
        infoActionTip: 'Información del elemento',
        popupTitle: 'Información del elemento',
        buttonText: 'Identificar'
    },

    "Viewer.PointSymbolizerMod.prototype":{
        uploadFileEmptyText: 'Selecciona un icono...',
        uploadFileLabel: 'Icono',
        waitMsgText: 'Espere...'
    }

});
