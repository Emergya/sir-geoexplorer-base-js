// Global GN settings
Ext.namespace('GeoNetwork');

//TODO: encapsulate cookie an GN_URL
var cookie = new Ext.state.CookieProvider({
    expires : new Date(new Date().getTime()
            + (1000 * 60 * 60 * 24 * 365))
});

var GN_URL = '../../../geonetwork';
//var GN_URL = 'http://localhost/geonetwork';


GeoNetwork.Settings = {};

// GN credentials. TODO: integrate with user logged
GeoNetwork.Settings.username = "admin";
GeoNetwork.Settings.password = "admin";

// Display in layer switcher options 
// @see GeoNetwork/MetadataResultsView.js
GeoNetwork.Settings.displayResultsInLayerSwitcher = false;

GeoNetwork.Util.defaultLocale = 'es';
// Restrict locales to a subset of languages
//GeoNetwork.Util.locales = [
//            ['fr', 'Français']
//    ];
GeoNetwork.searchDefault = {
    activeMapControlExtent: false
};
GeoNetwork.advancedFormButton = true;

GeoNetwork.Settings.editor = {
    defaultViewMode : 'simple',
    editHarvested: false
//    defaultViewMode : 'inspire'
};

// Define if default mode should be used for HTML print output instead of tabs only
GeoNetwork.printDefaultForTabs = false;

// Define if label needs to be displayed for login form next to username/password fields
GeoNetwork.hideLoginLabels = true;


// Define which type of search to use
// Old mode (xml.search with lucene, db access and XSL formatting)
//GeoNetwork.Settings.mdStore = GeoNetwork.data.MetadataResultsStore;
// IndexOnly mode (xml.search with lucene only) - recommended
GeoNetwork.Settings.mdStore = GeoNetwork.data.MetadataResultsFastStore;


//List of facet to display. If none, the server configuration is use.
GeoNetwork.Settings.facetListConfig = [{name: 'orgNames'}, 
                                    {name: 'keywords'}, 
                                    {name: 'licenses'}, 
                                    {name: 'types'},  
                                    {name: 'categories'},  
                                    {name: 'serviceTypes'}, 
                                    {name: 'denominators'}, 
                                    {name: 'createDateYears'}];
GeoNetwork.Settings.facetMaxItems = 7;

GeoNetwork.MapModule = true;
GeoNetwork.ProjectionList = [['EPSG:4326', 'WGS84 (lat/lon)']];
GeoNetwork.WMSList = [];

GeoNetwork.defaultViewMode = 'view-simple';

Ext.BLANK_IMAGE_URL = GN_URL + '/apps/js/ext/resources/images/default/s.gif';

GeoNetwork.Settings.results = {
        // Parameters to set bounding box highlighter colors
        // Use a custom single color for bounding box
        featurecolor: 'orange',
        // Use a random color map with 2 colors
        //colormap: GeoNetwork.Util.generateColorMap(2),
        // Use a default color map with 10 colors
        //colormap: GeoNetwork.Util.defaultColorMap,
        // Use a custom color map
        //colormap: ['red', 'green', 'blue'],
        colormap: undefined,
        // Use a custom CSS rules
        //featurecolorCSS: "border-width: 5px;border-style: solid; border-color: ${featurecolor}"
        featurecolorCSS: undefined
};