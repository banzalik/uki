uki.view.table.Column = uki.newClass(uki.view.Observable, new function() {
    this._width = 100;
    this._offset = 0;
    this._position = 0;
    this._minWidth = 40;
    this._css = 'overflow:hidden;float:left;white-space:nowrap;text-overflow:ellipsis;';
    this._inset = new Inset(3, 5);

    this.init = function() {};
    
    uki.addProps(this, ['position', 'css', 'formatter', 'label', 'resizable', 'maxWidth', 'minWidth']);
    
    this.template = function(v) {
        if (v === undefined) return this._template = this._template || uki.theme.template('table-cell');
        this._template = v;
        return this;
    };
    
    this.headerTemplate = function(v) {
        if (v === undefined) return this._headerTemplate = this._headerTemplate || uki.theme.template('table-header-cell');
        this._headerTemplate = v;
        return this;
    };
    
    /**
     * @fires event:beforeResize
     * @fires event:resize
     */
    this.width = uki.newProp('_width', function(w) {
        this._width = this._normailizeWidth(w);
        this.trigger('beforeResize', {source: this});
        if (this._stylesheet) {
            var rules = this._stylesheet.styleSheet ? this._stylesheet.styleSheet.rules : this._stylesheet.sheet.cssRules;
            rules[0].style.width = this._clientWidth() + PX;
        }
        this.trigger('resize', {source: this});
    });
    
    this._bindToDom = uki.F;
    
    this._normailizeWidth = function(w) {
        if (this._maxWidth) w = MIN(this._maxWidth, w);
        if (this._minWidth) w = MAX(this._minWidth, w);
        return w;
    };
    
    this.inset = uki.newProp('_inset', function(i) {
        this._inset = Inset.create(i);
    });
    
    this.render = function(row, rect, i) {
        this._prerenderedTemplate || this._prerenderTemplate(rect);
        this._prerenderedTemplate[1] = this._formatter ? this._formatter(row[this._position], row) : row[this._position];
        return this._prerenderedTemplate.join('');
    };
    
    this.renderHeader = function(height) {
        this._className || this._initStylesheet();
        var x = this.headerTemplate().render({
            data: this.label(),
            style: this._cellStyle(uki.dom.offset.boxModel ? height - 1 : height),
            className: this._className
        });
        return x;
    };
    
    this._prerenderTemplate = function(rect) {
        this._className || this._initStylesheet();
        this._prerenderedTemplate = this.template().render({
            data: '\u0001\u0001',
            style: this._cellStyle(rect.height),
            className: this._className
        }).split('\u0001');
    };
    
    this._cellStyle = function(height) {
        var inset = this._inset,
            padding = ['padding:', inset.top, 'px ', inset.right, 'px ', inset.bottom, 'px ', inset.left, 'px;'].join(''),
            h = 'height:' + (height - (uki.dom.offset.boxModel ? inset.height() : 0)) + 'px;';
        return this._css + padding + ';' + h;
    };
    
    this._clientWidth = function() {
        return this._width - (uki.dom.offset.boxModel ? this._inset.width() + 1 : 0);
    };
    
    this._initStylesheet = function() {
        if (!this._className) {
            uki.dom.offset.initializeBoxModel();
            this._className = 'uki-table-column-' + (++uki.dom.guid);
            var css = '.' + this._className + ' {width:' + this._clientWidth() + 'px;}';
            this._stylesheet = uki.dom.createStylesheet(css);
        }
    };
});

uki.view.table.NumberColumn = uki.newClass(uki.view.table.Column, new function() {
    var Base = uki.view.table.Column.prototype;

    this._css = Base._css + 'text-align:right;';
});

uki.view.table.CustomColumn = uki.view.table.Column;