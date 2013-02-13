/**
 * Copyright (c) 2008-2011 The Open Planning Project
 * 
 * Published under the GPL license.
 * See https://github.com/opengeo/gxp/raw/master/license.txt for the full text
 * of the license.
 */

/**
 * @requires plugins/Tool.js
 * @requires widgets/WMSStylesDialog.js
 * @requires plugins/GeoServerStyleWriter.js
 */

/** api: (define)
 *  module = gxp.plugins
 *  class = Styler
 */

/** api: (extends)
 *  plugins/Tool.js
 */
Ext.namespace("gxp.plugins");

/** api: constructor
 *  .. class:: Styler(config)
 *
 *    Plugin providing a styles editing dialog for geoserver layers.
 */
Viewer.plugins.Styler = Ext.extend(gxp.plugins.Styler, {
    
    /** api: ptype = vw_styler */
    ptype: "vw_styler",
    
    /** private: method[enableActionIfAvailable]
     *  :arg url: ``String`` URL of style service
     * 
     *  Enable the launch action if the service is available.
     */
    enableActionIfAvailable: function(url) {
        Ext.Ajax.request({
            method: "PUT",
            url: url,
            callback: function(options, success, response) {
                // we expect a 405 error code here if we are dealing
                // with GeoServer and have write access.
                this.launchAction.setDisabled(response.status !== 405 
                        && response.status !== 401); // 401 is proxy result not logged
            },
            scope: this
        });
    }
        
});

Ext.preg(Viewer.plugins.Styler.prototype.ptype, Viewer.plugins.Styler);
