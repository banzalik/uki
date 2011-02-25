var uki = require('uki-core');

var SplitPane = uki.newClass(uki.view.Container, uki.view.Focusable, {}),
    proto = SplitPane.prototype;

requireCss('./splitPane/splitPane.css');

proto.typeName = 'SplitPane';

proto._throttle = 0; // do not try to render more often than every Xms
proto._handlePosition = 200;
proto._leftSpeed = 0;
proto._rightSpeed = 1;
proto._handleWidth = 1;
proto._leftMin = 100;
proto._rightMin = 100;
proto._vertical = false;

proto._setup = function(initArgs) {
    this._vertical = initArgs.vertical || this._vertical;
    this._handleWidth = initArgs.handleWidth || this._handleWidth;
    this._originalWidth = 0;
    this._exts = [];
    uki.view.Container.prototype._setup.call(this, initArgs);
};

/**
* @function
* @name uki.view.HSplitPane#leftMin
*/
/**
* @function
* @name uki.view.HSplitPane#rightMin
*/
/**
* @function
* @name uki.view.HSplitPane#autogrowLeft
*/
/**
* @function
* @name uki.view.HSplitPane#autogrowRight
*/
/**
* @function
* @name uki.view.HSplitPane#throttle
*/
uki.addProps(proto, ['leftMin', 'rightMin', 'leftSpeed', 'rightSpeed', 'throttle']);
proto.topMin = proto.leftMin;
proto.bottomMin = proto.rightMin;
proto.topSpeed = proto.leftSpeed;
proto.bottomSpeed = proto.rightSpeed;

/**
* @function
* @fires event:handleMove
* @name uki.view.HSplitPane#handlePosition
*/
uki.addProp(proto, 'handlePosition', function(val) {
    if (this._x_width()) {
        // store width after manual (drag or program) position change
        this._prevWidth = this._x_width();

        this._prevPosition = this._handlePosition = this._normalizeHandlePosition(val);
        // resize imidiately
        this.resized();
    } else {
        this._handlePosition = val;
    }
});

proto._normalizeHandlePosition = function(pos) {
    pos = Math.min(pos, this._x_width() - this.rightMin() - this.handleWidth()); // can't move to far to the right
    pos = Math.max(pos, this.leftMin()); // can't move to far to the left
    return pos;
};

proto._moveHandle = function() {
    this._handle.style[this._x_leftName()] = this.handlePosition() + 'px';
};

/**
 * Positions of additional drag zones
 */
proto.extPositions = function(positions) {
    if (positions === undefined) {
        return uki.map(this._exts, function(ext) {
            return this._styleToPos(ext.style);
        }, this);
    }

    uki.forEach(this._exts, function(ext) {
        this._handle.removeChild(ext);
    }, this);

    this._exts = positions.map(function(pos) {
        var ext = uki.createElement('div', {
            className: 'uki-splitPane-handle-ext'
        });
        pos = this._expandPos(pos);
        this._applyPosToStyle(pos, ext.style);
        this._handle.appendChild(ext);
        return ext;
    }, this);
    return this;
};

/**
* @function
* @name uki.view.HSplitPane#handleWidth
*/
proto.handleWidth = function() {
    return this._handleWidth;
};

proto.vertical = function() {
    return this._vertical;
};

/**
 * Treat all splitPanes as vertical (pane|pane)
 * Use _x_methods to adjust to horizontal layout
 */
proto._x_width = function() {
    return this.vertical() ? this.dom().offsetWidth : this.dom().offsetHeight;
};

proto._x_widthName = function() {
    return this.vertical() ? 'width' : 'height';
};

proto._x_leftName = function() {
    return this.vertical() ? 'left' : 'top';
};

proto._x_type = function() {
    return this.vertical() ? 'v' : 'h';
};

proto._x_xName = function() {
    return this.vertical() ? 'x' : 'y';
};

proto._createHandle = function() {
    var handle = uki.fromHTML(uki.Mustache.to_html(
        requireText('splitPane/handle.html'),
        { type: this._x_type() }
    ));

    if (this.handleWidth() > 1) {
        handle.style[this._x_widthName()] = this.handleWidth() + 'px';
    } else {
        handle.className += ' ' + /*!css-class*/'uki-splitPane-handle_thin';
    }

    uki.forEach(['draggesturestart', 'draggesture', 'draggestureend'], function(name) {
        uki.addListener(handle, name, uki.bind(this['_' + name], this));
    }, this);

    return handle;
};

proto._createDom = function() {
    this._dom = uki.createElement('div', { className: 'splitPane' });

    uki([
        { view: 'Container', addClass: 'uki-splitPane-container uki-splitPane-container_left' },
        { view: 'Container', addClass: 'uki-splitPane-container uki-splitPane-container_right' }
    ]).appendTo(this);

    this._dom.appendChild(this._handle = this._createHandle());
};

proto._scheduleChildResize = function() {
    this._resizeChildViews();
};

proto._resizeSelf = function() {
    this._moveHandle();

    if (!this._prevWidth) {
        // store and forget
        this._prevWidth = this._x_width();
        this._prevPosition = this.handlePosition();
    } else {
        this._handlePosition = this._normalizeHandlePosition(this._calcDesiredPosition());
        this._moveHandle();
        this._scheduleChildResize();
    }
};

proto._calcDesiredPosition = function() {
    var newWidth = this._x_width(),
        diff = newWidth - this._prevWidth,
        totalSpeed = this.leftSpeed() + this.rightSpeed(),
        leftDiff = this.leftSpeed()/(totalSpeed || 1)*diff;

    return this._prevPosition + leftDiff;
};

proto._draggesturestart = function(e) {
    e.cursor = uki.computedStyle(this._handle, null).cursor;
    this._positionBeforeDrag = this.handlePosition();
};

proto._draggesture = function(e) {
    this._updatePositionOnDrag(e);
};

proto._draggestureend = function(e) {
    this._updatePositionOnDrag(e, true);
    // use new position as a base for next resize
    this._prevPosition = this.handlePosition();
    this._prevWidth = this._x_width();
};

proto._updatePositionOnDrag = function(e, stop) {
    var pos = this._positionBeforeDrag + e.dragOffset[this._x_xName()];
    this._handlePosition = this._normalizeHandlePosition(pos);
    this._moveHandle();
    this._scheduleChildResize();

    this.trigger({
        type: stop ? 'handleStop' : 'handleMove',
        target: this,
        handlePosition: this._handlePosition,
        dragPosition: pos
    });
};


/**
* @function
* @name uki.view.HSplitPane#topChildViews
*/
/**
* @function
* @name uki.view.HSplitPane#leftChildViews
*/
proto.topChildViews = proto.leftChildViews = function(views) {
    return this._childViewsAt(0, views);
};

/**
* @function
* @name uki.view.HSplitPane#rightChildViews
*/
/**
* @function
* @name uki.view.HSplitPane#bottomChildViews
*/
proto.bottomChildViews = proto.rightChildViews = function(views) {
    return this._childViewsAt(1, views);
};

proto._childViewsAt = function(i, views) {
    if (views === undefined) return this._childViews[i].childViews();
    this._childViews[i].childViews(views);
    return this;
};

proto._leftPos = function() {
    var pos = { left: '0px', top: '0px' };
    pos[this._x_widthName()] = this.handlePosition() + 'px';
    pos[this.vertical() ? 'bottom' : 'right'] = '0px';
    return pos;
};

proto._rightPos = function() {
    var pos = { bottom: '0px', right: '0px' };
    pos[this._x_leftName()] = this.handlePosition() + this.handleWidth() + 'px';
    pos[this.vertical() ? 'top' : 'left'] = '0px';
    return pos;
};

proto._resizeChildViews = function() {
    this._childViews[0].pos(this._leftPos()).resized();
    this._childViews[1].pos(this._rightPos()).resized();
};

uki.view.SplitPane = exports.SplitPane = SplitPane;