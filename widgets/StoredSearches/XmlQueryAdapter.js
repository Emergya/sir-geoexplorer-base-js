/**
 * Copyright (C) 2013
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

Viewer.plugins.XmlQueryAdapter = Ext.extend(Ext.util.Observable, {
    
    queryDef: null,

    constructor: function(config) {
        Viewer.plugins.XmlQueryAdapter.superclass.constructor.call(this, config);
    },

    parse: function(queryDef) {

        this.queryDef = queryDef || [];
        var conditions = new OpenLayers.Filter.Logical({
            type: OpenLayers.Filter.Logical.AND,
            filters: [
                //new OpenLayers.Filter.Spatial({
                //    type: OpenLayers.Filter.Spatial.BBOX,
                //    value: new OpenLayers.Bounds(-180, -90, 180, 90),
                //    projection: "EPSG:4326"
                //})
            ]
        });

        for (var i=0, l=this.queryDef.length; i<l; i++) {
            var queryItem = this.queryDef[i];
            if (!queryItem || queryItem.value == '') {
                continue
            }
            var condition = this.parseCondition(this.queryDef[i]);
            condition && conditions.filters.push(condition);
        }

        return conditions;
    },

    parseCondition: function(condition) {

        if (!condition.value || condition.value == '') {
            return null;
        }

        var filter = new OpenLayers.Filter.Comparison({
            type: condition.comparison,
            property: condition.property,
            value: condition.value
        });

        return filter;
    }
});
