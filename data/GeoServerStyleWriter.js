/**
 * Copyright (c) 2008-2011 The Open Planning Project
 * 
 * Published under the GPL license.
 * See https://github.com/opengeo/gxp/raw/master/license.txt for the full text
 * of the license.
 */

/**
 * @requires util.js
 * @requires plugins/StyleWriter.js
 */

Ext.namespace("Viewer.data");

/** api: (define)
 *  module = Viewer.data
 *  class = GeoServerStyleWriter
 */

/** api: (extends)
 *  plugins/GeoServerStyleWriter.js
 */

/** api: constructor
 *  .. class:: GeoServerStyleWriter(config)
 *   
 *      Save styles from :class:`gxp.WMSStylesDialog` or similar classes that
 *      have a ``layerRecord`` and a ``stylesStore`` with a ``userStyle``
 *      field. The plugin provides a save method, which will use the GeoServer
 *      RESTConfig API to persist style changes from the ``stylesStore`` to the
 *      server and associate them with the layer referenced in the target's
 *      ``layerRecord``.
 */
Viewer.data.GeoServerStyleWriter = Ext.extend(gxp.plugins.GeoServerStyleWriter, {
    
    /** private: method[writeStyle] 
     *  :arg styleRec: ``Ext.data.Record`` the record from the target's
     *      ``stylesStore`` to write
     *  :arg dispatchQueue: ``Array(Function)`` the dispatch queue the write
     *      function is added to.
     * 
     *  This method does not actually write styles, it just adds a function to
     *  the provided ``dispatchQueue`` that will do so.
     * 
     *  This modification encode URL to save styleNames with spaces.
     */
    writeStyle: function(styleRec, dispatchQueue) {
        var styleName = styleRec.get("userStyle").name;

        // #75731. Repair URL to make correct REST request
        var url = this.baseUrl + "/styles" + (styleRec.phantom === true ?
                    "" : "/" + styleName + ".xml");
        var geoserverLayerName = this.getGeoserverLayerName();

        dispatchQueue.push(function(callback, storage) {
            Ext.Ajax.request({
                method: styleRec.phantom === true ? "POST" : "PUT",
                url: url,
                headers: {
                    "Content-Type": "application/vnd.ogc.sld+xml; charset=UTF-8"
                },
                xmlData: this.target.createSLD({
                    userStyles: [styleName]
                }),
                failure: function() {
                    this._failed = true;
                    callback.call(this);
                },
                success: styleRec.phantom === true ? function(){
                    Ext.Ajax.request({
                        method: "POST",
                        url: this.baseUrl + "/layers/" +
                            geoserverLayerName + "/styles.json",
                        jsonData: {
                            "style": {
                                "name": styleName
                            }
                        },
                        failure: function() {
                            this._failed = true;
                            callback.call(this);
                        },
                        success: callback,
                        scope: this
                    });
                } : callback,
                scope: this
            });
        });
    },

    /** private: method[getGeoserverLayerName]
     *  Obtain layer selected name to make correct request
     */
    getGeoserverLayerName: function(){
        var geoserverLayerName = this.target.layerRecord.get("layer").params.LAYERS;
        if(!geoserverLayerName){
            this.target.layerRecord.get("name")
        }else if(geoserverLayerName.indexOf(":")>-1){
            geoserverLayerName = geoserverLayerName.split(":")[1];
        }
        return geoserverLayerName;
    },

    /** private: method[assignStyles]
     *  :arg defaultStyle: ``String`` The default style. Optional.
     *  :arg callback: ``Function`` The function to call when all operations
     *      succeeded. Will be called in the scope of this instance. Optional.
     */
    assignStyles: function(defaultStyle, callback) {
        var styles = [];

        // #75731. Repair URL to make correct REST request
        var geoserverLayerName = this.getGeoserverLayerName();

        this.target.stylesStore.each(function(rec) {
            if (!defaultStyle && rec.get("userStyle").isDefault === true) {
                defaultStyle = rec.get("name");
            }
            if (rec.get("name") !== defaultStyle &&
                                this.deletedStyles.indexOf(rec.id) === -1) {
                styles.push({"name": rec.get("name")});
            }
        }, this);
        Ext.Ajax.request({
            method: "PUT",
            url: this.baseUrl + "/layers/" +
                geoserverLayerName + ".json",
            jsonData: {
                "layer": {
                    "defaultStyle": {
                        "name": defaultStyle
                    },
                    "styles": styles.length > 0 ? {
                        "style": styles
                    } : {},
                    "enabled": true
                }
            },
            success: callback,
            failure: function() {
                this._failed = true;
                callback.call(this);
            },
            scope: this
        });
    }

});

/** api: ptype = gxp_geoserverstylewriter */
Ext.preg("gxp_geoserverstylewriter", Viewer.data.GeoServerStyleWriter);
