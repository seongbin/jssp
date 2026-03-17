var cScrollBar = {
	visible: true,
	width: utils.GetSystemMetrics(2),
	minCursorHeight: utils.GetSystemMetrics(3) * 4,
	timerID: false,
	timerCounter: -1
};

function oScrollbar(parent) {
	this.cursor = null;

	this.setNewColours = function () {
		this.setCursorButton();
	}

	this.setCursorButton = function () {
		var gb;
		var sx = this.cursorw * 0.25;
		var sy = 0;
		var sw = this.cursorw * 0.50;
		var sh = this.cursorh;

		this.cursorImage_normal = utils.CreateImage(this.cursorw, this.cursorh);
		gb = this.cursorImage_normal.GetGraphics();
		if (ppt.enableRoundedStyle) {
			gb.FillRoundedRectangle(sx, sy, sw, sh, sw * 0.5, sw * 0.5, setAlpha(g_colour_text, 50));
		} else {
			fillRectangle(gb, sx, sy, sw, sh, false, setAlpha(g_colour_text, 50));
		}
		this.cursorImage_normal.ReleaseGraphics();

		this.cursorImage_hover = utils.CreateImage(this.cursorw, this.cursorh);
		gb = this.cursorImage_hover.GetGraphics();
		if (ppt.enableRoundedStyle) {
			gb.FillRoundedRectangle(sx, sy, sw, sh, sw * 0.5, sw * 0.5, setAlpha(g_colour_text, 100));
		} else {
			fillRectangle(gb, sx, sy, sw, sh, false, setAlpha(g_colour_text, 100));
		}
		this.cursorImage_hover.ReleaseGraphics();

		this.cursorImage_down = utils.CreateImage(this.cursorw, this.cursorh);
		gb = this.cursorImage_down.GetGraphics();
		if (ppt.enableRoundedStyle) {
			gb.FillRoundedRectangle(sx, sy, sw, sh, sw * 0.5, sw * 0.5, setAlpha(g_colour_text, 150));
		} else {
			fillRectangle(gb, sx, sy, sw, sh, false, setAlpha(g_colour_text, 150));
		}
		this.cursorImage_down.ReleaseGraphics();

		this.cursor = new button(this.cursorImage_normal, this.cursorImage_hover, this.cursorImage_down);
		this.cursor.x = this.x;
		this.cursor.y = this.cursory;
	}

	this.draw = function (gr) {
		if (cScrollBar.visible) {
			this.cursor.draw(gr, this.x, this.cursory, 200);
		}
	}

	this.updateScrollbar = function () {
		var prev_cursorh = this.cursorh;
		this.total = typeof parent.rowsCount == "number" ? parent.rowsCount : parent.rows.length;
		this.rowh = typeof parent.rowHeight == "number" ? parent.rowHeight : ppt.rowHeight;
		this.totalh = this.total * this.rowh;
		cScrollBar.visible = (this.totalh > parent.h);
		this.cursorw = cScrollBar.width;
		if (this.total > 0) {
			this.cursorh = Math.round((parent.h / this.totalh) * this.h);
			if (this.cursorh < cScrollBar.minCursorHeight)
				this.cursorh = cScrollBar.minCursorHeight;
		} else {
			this.cursorh = cScrollBar.minCursorHeight;
		}
		this.setCursorY();
		if (this.cursorw && this.cursorh && this.cursorh != prev_cursorh)
			this.setCursorButton();
	}

	this.setCursorY = function () {
		var ratio = scroll / (this.totalh - parent.h);
		this.cursory = this.y + Math.round((this.h - this.cursorh) * ratio);
	}

	this.setSize = function () {
		this.w = cScrollBar.width;
		this.x = ww - this.w;
		this.y = parent.y;
		this.h = parent.h;
	}

	this.setScrollFromCursorPos = function () {
		var ratio = (this.cursory - this.y) / (this.h - this.cursorh);
		scroll = Math.round((this.totalh - parent.h) * ratio);
	}

	this.cursorCheck = function (event, x, y) {
		if (!this.cursor)
			return;
		switch (event) {
		case "lbtn_down":
			var tmp = this.cursor.checkstate(event, x, y);
			if (tmp == ButtonStates.down) {
				this.cursorDrag = true;
				this.cursorDragDelta = y - this.cursory;
			}
			break;
		case "lbtn_up":
			this.cursor.checkstate(event, x, y);
			if (this.cursorDrag) {
				this.setScrollFromCursorPos();
				parent.repaint();
			}
			this.cursorDrag = false;
			break;
		case "move":
			this.cursor.checkstate(event, x, y);
			if (this.cursorDrag) {
				this.cursory = y - this.cursorDragDelta;
				if (this.cursory + this.cursorh > this.y + this.h) {
					this.cursory = (this.y + this.h) - this.cursorh;
				}
				if (this.cursory < this.y) {
					this.cursory = this.y;
				}
				this.setScrollFromCursorPos();
				parent.repaint();
			}
			break;
		case "leave":
			break;
		}
	}

	this._isHover = function (x, y) {
		return x >= this.x && x <= this.x + this.w && y >= this.y && y <= this.y + this.h;
	}

	this._isHoverCursor = function (x, y) {
		return x >= this.x && x <= this.x + this.w && y >= this.cursory && y <= this.cursory + this.cursorh;
	}

	this._isHoverEmptyArea = function (x, y) {
		return this.isHover && !this.isHoverCursor;
	}

	this.on_mouse = function (event, x, y, delta) {
		this.isHover = this._isHover(x, y);
		this.isHoverCursor = this._isHoverCursor(x, y);
		this.isHoverEmptyArea = this._isHoverEmptyArea(x, y);
		var scroll_step_page = parent.h;

		switch (event) {
		case "lbtn_down":
		case "lbtn_dblclk":
			if ((this.isHoverCursor || this.cursorDrag) && !this.isHoverEmptyArea) {
				this.cursorCheck(event, x, y);
			} else {
				if (this.isHoverEmptyArea) {
					if (y < this.cursory) {
						scroll = scroll - scroll_step_page;
						scroll = check_scroll(scroll);
						if (!cScrollBar.timerID) {
							cScrollBar.timerID = window.SetInterval(function () {
								if (cScrollBar.timerCounter > 6 && m_y < parent.scrollbar.cursory) {
									scroll = scroll - scroll_step_page;
									scroll = check_scroll(scroll);
								} else {
									cScrollBar.timerCounter++;
								}
							}, 80);
						}
					} else {
						scroll = scroll + scroll_step_page;
						scroll = check_scroll(scroll);
						if (!cScrollBar.timerID) {
							cScrollBar.timerID = window.SetInterval(function () {
								if (cScrollBar.timerCounter > 6 && m_y > parent.scrollbar.cursory + parent.scrollbar.cursorh) {
									scroll = scroll + scroll_step_page;
									scroll = check_scroll(scroll);
								} else {
									cScrollBar.timerCounter++;
								}
							}, 80);
						}
					}
				}
			}
			break;
		case "rbtn_up":
		case "lbtn_up":
			if (cScrollBar.timerID) {
				window.ClearInterval(cScrollBar.timerID);
				cScrollBar.timerID = false;
			}
			cScrollBar.timerCounter = -1;

			this.cursorCheck(event, x, y);
			break;
		case "move":
			this.cursorCheck(event, x, y);
			break;
		case "wheel":
			this.cursorCheck(event, 0, 0);
			break;
		}
	}
}
