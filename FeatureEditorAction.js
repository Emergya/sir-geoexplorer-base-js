/**
 * Copyright (C) 2012
 *
 * This file is part of the project ohiggins
 *
 * This software is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation; either version 2 of the License, or (at your option) any
 * later version.
 *
 * This software is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 * details.
 *
 * You should have received a copy of the GNU General Public License along with
 * this library; if not, write to the Free Software Foundation, Inc., 51
 * Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
 *
 * As a special exception, if you link this library with other files to produce
 * an executable, this library does not by itself cause the resulting executable
 * to be covered by the GNU General Public License. This exception does not
 * however invalidate any other reasons why the executable file might be covered
 * by the GNU General Public License.
 *
 * Author: Antonio Hernández <ahernandez@emergya.com>
 */


/**
 * @requires plugins/Tool.js
 */

/** api: (define)
 *  module = gxp.plugins
 *  class = FeatureEditorAction
 */

/** api: (extends)
 *  plugins/Tool.js
 */
Ext.namespace("Viewer.plugins");

/** api: constructor
 */
Viewer.plugins.FeatureEditorAction = Ext.extend(gxp.plugins.FeatureEditor, {
    
    /** api: ptype = vw_featureeditor */
    ptype: "vw_featureeditor",

    /** private: method[init]
     * :arg target: ``Object`` The object initializing this plugin.
     */
    init: function(target) {
        Viewer.plugins.FeatureEditorAction.superclass.init.apply(this, arguments);
        this.target.on('beforerender', this.addActions, this);
    },

    /** private: method[getFeatureManager]
     * Overwrite the original method so we can find
     * featuremanagers defined in Composer.js
     * :returns: :class:`gxp.plugins.FeatureManager`
     */
    getFeatureManager: function() {
        var manager = this.target.tools[this.featureManager];
        if (!manager) {
            manager = window.app.tools[this.featureManager];
            if (manager) {
                // This fix the same problem in ClickableFeature.js
                this.target.tools[this.featureManager] = manager;
            }
        }
        if (!manager) {
            throw new Error("Unable to access feature manager by id: " + this.featureManager);
        }
        return manager;
    }
        
});

Ext.preg(Viewer.plugins.FeatureEditorAction.prototype.ptype, Viewer.plugins.FeatureEditorAction);
