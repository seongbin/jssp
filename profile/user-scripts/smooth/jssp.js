function on_char(code) {
	if (brw.inputbox.edit) {
		brw.inputbox.on_char(code);
	}
}

function on_drag_drop(action, x, y, mask) {
	if (x > brw.scrollbar.x || y < brw.y) {
		action.Effect = 0;
	} else {
		if (playlist_can_add_items(g_active_playlist)) {
			plman.ClearPlaylistSelection(g_active_playlist);
			plman.UndoBackup(g_active_playlist);
			action.Playlist = g_active_playlist;
			action.Base = plman.GetPlaylistItemCount(g_active_playlist);
			action.ToSelect = true;
			action.Effect = 1;
		} else if (g_active_playlist == -1) {
			action.Playlist = plman.CreatePlaylist(plman.PlaylistCount, "Dropped Items");
			action.Base = 0;
			action.ToSelect = true;
			action.Effect = 1;
		} else {
			action.Effect = 0;
		}
	}
}

function on_drag_over(action, x, y, mask) {
	if (x > brw.scrollbar.x || y < brw.y) {
		action.Effect = 0;
	} else {
		if (g_active_playlist == -1 || playlist_can_add_items(g_active_playlist)) {
			action.Effect = 1;
		} else {
			action.Effect = 0;
		}
	}
}

function on_focus(is_focused) {
	if (is_focused) {
		plman.SetActivePlaylistContext();
		window.SetPlaylistSelectionTracking();
	} else {
		brw.repaint();
	}
}

function on_item_focus_change(playlist, from, to) {
	g_focus_id = to;

	if (playlist == g_active_playlist) {
		g_focus_row = brw.getOffsetFocusItem(g_focus_id);

		if (g_focus_row < scroll / ppt.rowHeight || g_focus_row > scroll / ppt.rowHeight + brw.totalRowsVis - 0.1) {
			var old = scroll;
			scroll = (g_focus_row - Math.floor(brw.totalRowsVis / 2)) * ppt.rowHeight;
			scroll = check_scroll(scroll);
			if (Math.abs(scroll - scroll_) > ppt.rowHeight * 5) {
				if (scroll_ > scroll) {
					scroll_ = scroll + ppt.rowHeight * 5;
				} else {
					scroll_ = scroll - ppt.rowHeight * 5;
				}
			}
			brw.scrollbar.updateScrollbar();
		}

		if (!isScrolling)
			brw.repaint();
	}
}

function on_key_down(vkey) {
	if (brw.inputbox.edit) {
		brw.inputbox.on_key_down(vkey);
	} else {
		var mask = GetKeyboardMask();

		if (mask == KMask.none) {
			switch (vkey) {
			case VK_F3:
				brw.inputbox.edit = true;
				break;
			case VK_F5:
				utils.RemoveFolderRecursive(CACHE_FOLDER, 1);
				images.clear();
				brw.populate();
				break;
			case VK_SPACEBAR: fb.PlayOrPause(); break;
			case VK_LEFT: fb.RunMainMenuCommand("Playback/Seek/Back by 5 seconds"); break;
			case VK_RIGHT: fb.RunMainMenuCommand("Playback/Seek/Ahead by 5 seconds"); break;
			case VK_UP:
				if (brw.rows.length > 0 && !brw.keypressed && !cScrollBar.timerID) {
					brw.keypressed = true;

					vk_up();
					if (!cScrollBar.timerID) {
						cScrollBar.timerID = window.SetTimeout(function () {
							cScrollBar.timerID = window.SetInterval(vk_up, 100);
						}, 400);
					}
				}
				break;
			case VK_DOWN:
				if (brw.rows.length > 0 && !brw.keypressed && !cScrollBar.timerID) {
					brw.keypressed = true;

					vk_down();
					if (!cScrollBar.timerID) {
						cScrollBar.timerID = window.SetTimeout(function () {
							cScrollBar.timerID = window.SetInterval(vk_down, 100);
						}, 400);
					}
				}
				break;
			case VK_RETURN:
				play(g_active_playlist, g_focus_id);
				break;
			case VK_END:
				if (brw.rows.length > 0) {
					var new_focus_id = brw.rows[brw.rows.length - 1].playlistTrackId;
					plman.SetPlaylistFocusItem(g_active_playlist, new_focus_id);
					plman.ClearPlaylistSelection(g_active_playlist);
					plman.SetPlaylistSelectionSingle(g_active_playlist, new_focus_id, true);
				}
				break;
			case VK_HOME:
				if (brw.rows.length > 0) {
					var new_focus_id = brw.rows[0].playlistTrackId;
					plman.ClearPlaylistSelection(g_active_playlist);
					plman.SetPlaylistSelectionSingle(g_active_playlist, new_focus_id, true);
					plman.SetPlaylistFocusItem(g_active_playlist, new_focus_id);
				}
				break;
			case VK_DELETE:
				if (playlist_can_remove_items(g_active_playlist)) {
					plman.UndoBackup(g_active_playlist);
					plman.RemovePlaylistSelection(g_active_playlist);
				}
				break;
			}
		} else if (mask == KMask.shift) {
			switch (vkey) {
			case VK_SHIFT:
				brw.SHIFT_count = 0;
				break;
			case VK_UP:
				if (brw.SHIFT_count == 0) {
					if (brw.SHIFT_start_id == null) {
						brw.SHIFT_start_id = g_focus_id;
					}
					plman.ClearPlaylistSelection(g_active_playlist);
					plman.SetPlaylistSelectionSingle(g_active_playlist, g_focus_id, true);
					if (g_focus_id > 0) {
						brw.SHIFT_count--;
						g_focus_id--;
						plman.SetPlaylistSelectionSingle(g_active_playlist, g_focus_id, true);
						plman.SetPlaylistFocusItem(g_active_playlist, g_focus_id);
					}
				} else if (brw.SHIFT_count < 0) {
					if (g_focus_id > 0) {
						brw.SHIFT_count--;
						g_focus_id--;
						plman.SetPlaylistSelectionSingle(g_active_playlist, g_focus_id, true);
						plman.SetPlaylistFocusItem(g_active_playlist, g_focus_id);
					}
				} else {
					plman.SetPlaylistSelectionSingle(g_active_playlist, g_focus_id, false);
					brw.SHIFT_count--;
					g_focus_id--;
					plman.SetPlaylistFocusItem(g_active_playlist, g_focus_id);
				}
				break;
			case VK_DOWN:
				if (brw.SHIFT_count == 0) {
					if (brw.SHIFT_start_id == null) {
						brw.SHIFT_start_id = g_focus_id;
					}
					plman.ClearPlaylistSelection(g_active_playlist);
					plman.SetPlaylistSelectionSingle(g_active_playlist, g_focus_id, true);
					if (g_focus_id < brw.list.Count - 1) {
						brw.SHIFT_count++;
						g_focus_id++;
						plman.SetPlaylistSelectionSingle(g_active_playlist, g_focus_id, true);
						plman.SetPlaylistFocusItem(g_active_playlist, g_focus_id);
					}
				} else if (brw.SHIFT_count > 0) {
					if (g_focus_id < brw.list.Count - 1) {
						brw.SHIFT_count++;
						g_focus_id++;
						plman.SetPlaylistSelectionSingle(g_active_playlist, g_focus_id, true);
						plman.SetPlaylistFocusItem(g_active_playlist, g_focus_id);
					}
				} else {
					plman.SetPlaylistSelectionSingle(g_active_playlist, g_focus_id, false);
					brw.SHIFT_count++;
					g_focus_id++;
					plman.SetPlaylistFocusItem(g_active_playlist, g_focus_id);
				}
				break;
			}
		} else if (mask == KMask.ctrl) {
			switch (vkey) {
			case 37: // CTRL+LEFT
				fb.RunMainMenuCommand("File/Next playlist");
				break;
			case 39: // CTRL+RIGHT
				fb.RunMainMenuCommand("File/Previous playlist");
				break;
			case 48: // CTRL+0
				if (ppt.fontSize > ppt.fontSizes[0]) {
					ppt.fontSize = ppt.fontSizes[0];
					window.SetProperty("SMOOTH.FONT.SIZE", ppt.fontSize);
					get_font();
					get_metrics();
					get_images();
					brw.repaint();
				}
				break;
			case 65: // CTRL+A
				fb.RunMainMenuCommand("Edit/Select all");
				brw.repaint();
				break;
			case 67: // CTRL+C
				var items = plman.GetPlaylistSelectedItems(g_active_playlist);
				items.CopyToClipboard();
				items.Dispose();
				break;
			case 68: // CTRL+D
				ppt.enableRowDual = !ppt.enableRowDual;
				window.SetProperty("SMOOTH.ROW.DUAL.ENABLED", ppt.enableRowDual);
				get_metrics();
				brw.repaint();
				brw.showNowPlaying();
				break;
				break;
			case 69: // CTRL+E
				ppt.enableRowStripe = !ppt.enableRowStripe;
				window.SetProperty("SMOOTH.ROW.STRIPE.ENABLED", ppt.enableRowStripe);
				get_metrics();
				brw.repaint();
				break;
			case 71: // CTRL+G
				ppt.enableGroupHeader = !ppt.enableGroupHeader;
				window.SetProperty("SMOOTH.GROUP.HEADER.ENABLED", ppt.enableGroupHeader);
				get_metrics();
				brw.repaint();
				brw.showNowPlaying();
				break;
			case 86: // CTRL+V
				if (playlist_can_add_items(g_active_playlist) && fb.CheckClipboardContents()) {
					var clipboard_contents = fb.GetClipboardContents();
					plman.UndoBackup(g_active_playlist);
					plman.InsertPlaylistItems(g_active_playlist, plman.GetPlaylistItemCount(g_active_playlist), clipboard_contents);
					clipboard_contents.Dispose();
				}
				break;
			case 88: // CTRL+X
				if (playlist_can_remove_items(g_active_playlist)) {
					var items = plman.GetPlaylistSelectedItems(g_active_playlist);
					if (items.CopyToClipboard()) {
						plman.UndoBackup(g_active_playlist);
						plman.RemovePlaylistSelection(g_active_playlist);
					}
					items.Dispose();
				}
				break;
			case 89: // CTRL+Y
				fb.RunMainMenuCommand("Edit/Redo");
				break;
			case 90: // CTRL+Z
				fb.RunMainMenuCommand("Edit/Undo");
				break;
			}
		} else if (mask == KMask.alt) {
			switch (vkey) {
			default:
				if (window.IsDefaultUI && fb.CheckComponent("foo_openhacks")) {
					fb.RunMainMenuCommand("View/Show main menu");
				} else {
					fb.RunMainMenuCommand("View/Show toolbars");
				}
				break;
			}
		}
	}
}

function on_key_up(vkey) {
	brw.keypressed = false;
	kill_scrollbar_timer()
	if (vkey == VK_SHIFT) {
		brw.SHIFT_start_id = null;
		brw.SHIFT_count = 0;
	}
	brw.repaint();
}

function on_mouse_lbtn_dblclk(x, y, mask) {
	brw.on_mouse("lbtn_dblclk", x, y);
}

function on_mouse_lbtn_down(x, y) {
	brw.on_mouse("lbtn_down", x, y);
}

function on_mouse_lbtn_up(x, y) {
	brw.on_mouse("lbtn_up", x, y);
}

function on_mouse_move(x, y) {
	if (m_x == x && m_y == y)
		return;

	m_x = x;
	m_y = y;

	brw.on_mouse("move", x, y);
}

function on_mouse_rbtn_up(x, y) {
	brw.on_mouse("rbtn_up", x, y);
	return true;
}

function on_mouse_wheel(step) {
	if (utils.IsKeyPressed(VK_CONTROL)) {
		update_extra_font_size(step);
	} else {
		scroll -= step * ppt.rowHeight * ppt.rowScrollStep;
		scroll = check_scroll(scroll);
		brw.on_mouse("wheel", m_x, m_y, step);
	}
}

function on_playback_dynamic_info_track(type) {
	if (type == 1) {
		if (ppt.wallpapermode == 1) {
			setWallpaperImg();
		}

		if (ppt.enableDynamicColours) {
			on_colours_changed();
		}
	}

	brw.repaint();
}

function on_playback_new_track() {
	g_time = tfo.time.Eval();
	setWallpaperImg();

	if (ppt.enableDynamicColours) {
		on_colours_changed();
	}

	brw.repaint();
}

function on_playback_order_changed() {
	get_images();
}

function on_playback_pause(state) {
	if (brw.nowplaying_y + ppt.rowHeight > brw.y && brw.nowplaying_y < brw.y + brw.h) {
		get_images();
		brw.repaint();
	}
}

function on_playback_stop(reason) {
	g_time = "";

	if (reason != 2) {
		setWallpaperImg();

		if (ppt.enableDynamicColours) {
			on_colours_changed();
		}
	}

	get_images();
	brw.repaint();
}

function on_playback_time() {
	g_seconds++;
	g_time = tfo.time.Eval();

	if (brw.nowplaying_y + ppt.rowHeight > brw.y && brw.nowplaying_y < brw.y + brw.h) {
		window.RepaintRect(brw.x, brw.nowplaying_y, brw.w, ppt.rowHeight);
	}
}

function on_playlist_item_ensure_visible(playlist, index) {
	on_item_focus_change(playlist, 0, index);
}

function on_playlist_items_added(playlistIndex) {
	if (playlistIndex == g_active_playlist) {
		g_focus_id = getFocusId();
		get_images();
		brw.populate();
	}
}

function on_playlist_items_changed(playlistIndex) {
	if (playlistIndex == g_active_playlist) {
		get_images();
		brw.populate();
	}
}

function on_playlist_items_removed(playlistIndex, new_count) {
	if (playlistIndex == g_active_playlist) {
		if (new_count == 0) {
			scroll = scroll_ = 0;
		}
		g_focus_id = getFocusId();
		get_images();
		brw.populate();
	}
}

function on_playlist_items_reordered(playlistIndex) {
	if (playlistIndex == g_active_playlist) {
		g_focus_id = getFocusId();
		get_images();
		brw.populate();
	}
}

function on_playlist_items_replaced(playlistIndex) {
	if (playlistIndex == g_active_playlist) {
		get_images();
		brw.populate();
	}
}

function on_playlist_items_selection_change() {
	get_images();
	brw.repaint();
}

function on_playlist_switch() {
	g_active_playlist = plman.ActivePlaylist;
	g_focus_id = getFocusId();
	get_images();
	brw.populate();
}

function on_playlists_changed() {
	g_active_playlist = plman.ActivePlaylist;
	get_images();
	brw.repaint();
}

function oBrowser() {
	this.repaint = function () {
		need_repaint = true;
	}

	this.setSize = function () {
		// headerBar part
		this.hx = 0;
		this.hy = 0;
		this.hw = ww;
		this.hh = ppt.headerBarHeight;

		// bottomBar part
		this.bh = M;
		this.bx = 0;
		this.by = wh - this.bh;
		this.bw = ww;

		this.x = M * 2;
		this.y = this.hy + this.hh;
		this.w = ww - this.x - M * 2;
		this.h = this.by - this.y;
		this.totalRows = Math.ceil(this.h / ppt.rowHeight);
		this.totalRowsVis = Math.floor(this.h / ppt.rowHeight);

		this.btn_reset = new button(images.reset_normal, images.reset_hover, images.reset_hover);
		this.btn_play = new button(images.play_normal, images.play_hover, images.play_hover);
		this.btn_prev = new button(images.prev_normal, images.prev_hover, images.prev_hover);
		this.btn_next = new button(images.next_normal, images.next_hover, images.next_hover);
		this.btn_pord = new button(images.pord_normal, images.pord_hover, images.pord_hover);
		this.btn_mode = new button(images.mode_normal, images.mode_hover, images.mode_hover);
		this.btn_add_folder = new button(images.add_folder_normal, images.add_folder_hover, images.add_folder_down);
		this.btn_edit_query = new button(images.edit_query_normal, images.edit_query_hover, images.edit_query_down);

		this.inputbox.setSize(M * 12, M * 2);
		this.scrollbar.setSize();

		scroll = Math.round(scroll / ppt.rowHeight) * ppt.rowHeight;
		scroll = check_scroll(scroll);
		scroll_ = scroll;

		this.scrollbar.updateScrollbar();
	}

	this.setList = function () {
		this.rows = [];
		var r = 0;

		for (var i = 0; i < this.groups.length; i++) {
			var s = this.groups[i].start;
			var group = this.groups[i];

			var show_group_header = ppt.enableGroupHeader;
			if (group.totaldiscs > 1 && group.discnumber > 1) {
				for (var g = 0; g < i; g++) {
					if (this.groups[g].album == group.album && this.groups[g].discnumber == 1) {
						show_group_header = false;
						break;
					}
				}
			}

			if (show_group_header) {
				group.rowId = r;
				for (var k = 0; k < ppt.groupHeaderRowsNumber; k++) {
					this.rows[r] = new Object();
					this.rows[r].type = k + 1;
					this.rows[r].metadb = group.metadb;
					this.rows[r].albumId = i;
					this.rows[r].albumTrackId = 0;
					this.rows[r].playlistTrackId = s;
					r++;
				}
			}

			if (group.totaldiscs > 1 && ppt.enableGroupHeader) {
				this.rows[r] = new Object();
				this.rows[r].type = -1; // disc header row
				this.rows[r].metadb = group.metadb;
				this.rows[r].albumId = i;
				this.rows[r].albumTrackId = -1;
				this.rows[r].playlistTrackId = s;
				r++;
			}

			var m = group.count;
			for (var j = 0; j < m; j++) {
				this.rows[r] = new Object();
				this.rows[r].type = 0;
				this.rows[r].metadb = this.list.GetItem(s + j);
				this.rows[r].track_tf = this.track_tf_arr[s + j];
				this.rows[r].albumId = i;
				this.rows[r].albumTrackId = j;
				this.rows[r].playlistTrackId = s + j;
				r++;
			}
		}
	}

	this.showFocusedItem = function () {
		g_focus_row = this.getOffsetFocusItem(g_focus_id);
		scroll = (g_focus_row - Math.floor(this.totalRowsVis / 2)) * ppt.rowHeight;
		scroll = check_scroll(scroll);
		this.scrollbar.updateScrollbar();
	}

	this.getAlbumIdfromTrackId = function (value) {
		if (value >= 0) {
			var mediane = 0;
			var deb = 0;
			var fin = this.groups.length - 1;
			while (deb <= fin) {
				mediane = Math.floor((fin + deb) / 2);
				if (value >= this.groups[mediane].start && value < this.groups[mediane].start + this.groups[mediane].count) {
					return mediane;
				} else if (value < this.groups[mediane].start) {
					fin = mediane - 1;
				} else {
					deb = mediane + 1;
				}
			}
		}
		return -1;
	}

	this.getOffsetFocusItem = function (fid) {
		var row_idx = 0;
		if (fid > -1) {
			if (ppt.enableGroupHeader) {
				g_focus_album_id = this.getAlbumIdfromTrackId(fid);
				for (i = 0; i < this.rows.length; i++) {
					if (this.rows[i].type != 0 && this.rows[i].albumId == g_focus_album_id) {
						var albumTrackId = g_focus_id - this.groups[g_focus_album_id].start;
						row_idx = i + ppt.groupHeaderRowsNumber + albumTrackId;
						break;
					}
				}
			} else {
				g_focus_album_id = this.getAlbumIdfromTrackId(fid);
				for (i = 0; i < this.rows.length; i++) {
					if (this.rows[i].type == 0 && this.rows[i].albumId == g_focus_album_id) {
						var albumTrackId = g_focus_id - this.groups[g_focus_album_id].start;
						row_idx = i + albumTrackId;
						break;
					}
				}
			}
		}
		return row_idx;
	}

	this.get_track_tags = function (index) {
		var track_arr = this.rows[index].track_tf.split(" ^^ ");
		var tags = {
			artist: track_arr[0],
			title: track_arr[1],
			genre: track_arr[2],
			album: track_arr[3],
			tracknumber: track_arr[4],
			length: track_arr[5],
			rating: track_arr[6],
			playcount: track_arr[7],
			added: track_arr[8],
			track_artist: track_arr[9],
		};
		return tags;
	}

	this.init_groups = function () {
		this.groups = [];
		if (this.list.Count == 0)
			return;

		var arr = tfo.groupkey.EvalWithMetadbs(this.list).toArray();
		var previous = "";
		var g = 0, t = 0;

		var search_text = process_string(g_search_text);

		for (var i = 0; i < this.list.Count; i++) {
			var handle = this.list.GetItem(i);
			var meta = arr[i];
			var current = meta.toLowerCase();
			var length = Math.max(handle.Length, 0);
			var cachekey = utils.HashString(handle.Path);

			if (search_text.length) {
				// filter range
				var search_key = current.split(" ^^ ") + "," + this.track_tf_arr[i].split(" ^^ ").slice(0, 3);
				var toAdd = match(search_key, search_text);
			} else {
				var toAdd = true;
			}

			if (toAdd) {
				if (current != previous) {
					if (g > 0) {
						this.groups[g - 1].finalise(t, group_length);
						t = 0;
					}
					this.groups.push(new oGroup(g, i, handle, meta, cachekey));
					t++;
					g++;
					previous = current;
					group_length = length;
				} else {
					t++;
					group_length += length;
				}
			}
		}

		if (g > 0) {
			this.groups[g - 1].finalise(t, group_length);
		}
	}

	this.populate = function () {
		this.list.RemoveAll();
		this.list = plman.GetPlaylistItems(g_active_playlist);
		this.track_tf_arr = tfo.track.EvalWithMetadbs(this.list).toArray();

		this.init_groups();
		this.setList();
		g_focus_row = this.getOffsetFocusItem(g_focus_id);

		this.scrollbar.updateScrollbar();
		this.repaint();
	}

	this.getlimits = function () {
		if (this.rows.length <= this.totalRowsVis) {
			var start_ = 0;
			var end_ = this.rows.length - 1;
		} else {
			if (scroll_ < 0)
				scroll_ = scroll;
			var start_ = Math.round(scroll_ / ppt.rowHeight + 0.4);
			var end_ = start_ + this.totalRows + (ppt.groupHeaderRowsNumber - 1);
			start_ = start_ > 0 ? start_ - 1 : start_;
			if (start_ < 0)
				start_ = 0;
			if (end_ >= this.rows.length)
				end_ = this.rows.length - 1;
		}
		g_start_ = start_;
		g_end_ = end_;
	}

	this.draw = function (gr) {
		drawBackground(gr);

		this.getlimits();

		if (this.rows.length > 0) {
			var ax = this.x;
			var ay = this.y;
			var aw = this.w;
			var ah = ppt.rowHeight;

			var loc = plman.GetPlayingItemLocation();

			for (var i = g_start_; i <= g_end_; i++) {
				ay = Math.floor(this.y + (i * ah) - scroll_);
				var normal_text = g_colour_text;
				var fader_text = setAlpha(normal_text, 100);

				switch (this.rows[i].type) {
				case ppt.groupHeaderRowsNumber:
					ay -= (ppt.groupHeaderRowsNumber - 1) * ah;
					var is_playing_group = loc.PlaylistItemIndex >= this.groups[this.rows[i].albumId].start && loc.PlaylistItemIndex < this.groups[this.rows[i].albumId].start + this.groups[this.rows[i].albumId].count;
					var id = this.rows[i].albumId;
					var group = this.groups[id];
					var group_count = group.count + (this.groups[this.rows[i].albumId].count < group.totaltracks ? ("/" + group.totaltracks) : "") + (group.count > 1 ? " songs" : " song");
					var group_length = group.total_group_duration_txt;
					var group_height = ah * ppt.groupHeaderRowsNumber;

					// group cover
					if (!group.cover_image && !group.image_requested) {
						group.image_requested = true;
						group.cover_image = get_art(this.rows[i].metadb, group.cachekey, AlbumArtId.front);
					}

					if (group.cover_image) {
						if (ppt.enableGroupBackground && !group.dominant) {
							group.dominant = get_dominant_colour(group.cover_image, group.cachekey);
						}
						if (group.dominant) {
							var background = window.IsDark ? shade_colour(group.dominant, 5) : tint_colour(group.dominant, 5);
							normal_text = DetermineTextColour(background);
							fader_text = blendColours(background, normal_text, 0.45);
							fillRectangle(gr, ax, ay, aw, group_height, ppt.enableRoundedCorner, background);
						} else {
							fillRectangle(gr, ax, ay, aw, group_height, ppt.enableRoundedCorner, setAlpha(g_colour_text, 4));
						}
						drawImage(gr, group.cover_image, ax + M, ay + M, group_height - M * 2, group_height - M * 2, false, 1.0, setAlpha(normal_text, 48), ppt.enableRoundedCorner);
					} else {
						fillRectangle(gr, ax + M, ay + M, group_height - M * 2, group_height - M * 2, ppt.enableRoundedCorner, setAlpha(g_colour_text, 16));
						gr.WriteTextSimple(this.rows[i].metadb.Length ? "NO\nCOVER" : "WEB\nRADIOS", g_font_bold, fader_text, ax + M, ay + M, group_height - M * 2, group_height - M * 2, 2, 2, 1, 1);
					}

					// group text
					var text_x = ax + group_height;
					if (ppt.enableRowDual) {
						var text_width = aw - group_height - M;
						var text_y = ay + (group_height - g_font_group2_height) * 0.5;
						gr.WriteTextSimple(group.artist, g_font_group2, fader_text, text_x, text_y, text_width, g_font_group2_height, 0, 1, 1, 1);
						gr.WriteTextSimple(group.album, g_font_group1, normal_text, text_x, text_y - g_font_group1_height, text_width, g_font_group1_height, 0, 1, 1, 1);
						gr.WriteTextSimple(group.date + " \u2022 " + group_count + " \u2022 " + group_length + " \u2022 " + group.copyright, g_font, fader_text, text_x, text_y + g_font_group2_height, text_width, g_font_height, 0, 1, 1, 1);
					} else {
						var date_width = group.date.calc_width2(g_font) + M;
						var copyright_width = group.copyright.calc_width2(g_font) + M;
						var right_width = Math.min(Math.max(date_width, copyright_width), aw * 0.35);
						gr.WriteTextSimple(group.date, g_font, fader_text, ax + aw - right_width - M, ay + group_height * 0.5 - g_font_height, right_width, g_font_height, 1, 1, 1, 1);
						gr.WriteTextSimple(group.copyright, g_font, fader_text, ax + aw - right_width - M, ay + group_height * 0.5, right_width, g_font_height, 1, 1, 1, 1);
						gr.WriteTextSimple(group.album, g_font_group2, normal_text, text_x, ay + group_height * 0.5 - g_font_group2_height, aw - right_width - group_height - M * 2, g_font_group2_height, 0, 1, 1, 1);
						gr.WriteTextSimple(group.artist, g_font_group2, fader_text, text_x, ay + group_height * 0.5, aw - right_width - group_height - M * 2, g_font_group2_height, 0, 1, 1, 1);
					}

					break;
				case -1:
					var disc_group = this.groups[this.rows[i].albumId];
					var disc_text = "Disc " + disc_group.discnumber + " / " + disc_group.totaldiscs;
					gr.WriteTextSimple(disc_text, g_font, g_colour_highlight, ax + M, ay, aw - M * 2, ah, 0, 2, 1, 1);
					break;
				case 0:
					// odd/even background
					if (ppt.enableRowStripe) {
						if (ppt.enableGroupHeader ? this.rows[i].albumTrackId % 2 != 0 : i % 2 != 0) {
							fillRectangle(gr, ax, ay, aw, ah, ppt.enableRoundedCorner, setAlpha(g_colour_text, 4)); // this.groups[this.rows[i].albumId].colour[0]
						}
					}

					if (!this.rows[i].tags) {
						this.rows[i].tags = this.get_track_tags(i);
					}

					var playlistTrackId = this.rows[i].playlistTrackId;
					var is_focused = g_focus_id == playlistTrackId;
					var is_playing = loc.PlaylistIndex == g_active_playlist && loc.PlaylistItemIndex == playlistTrackId;
					var is_selected = plman.IsPlaylistItemSelected(g_active_playlist, playlistTrackId);
					var tags = this.rows[i].tags;
					var col1 = is_selected || is_playing ? g_colour_highlight : normal_text;
					var col2 = is_selected ? normal_text : is_playing ? g_colour_highlight : fader_text;
					var col3 = is_selected || is_playing ? normal_text : fader_text;
					var tnw = 0, lw = 0, rw = 0; // track number width, length width, rating width

					if (is_playing) {
						this.nowplaying_y = ay;
					}

					if (is_selected) {
						fillRectangle(gr, ax, ay, aw, ah, ppt.enableRoundedCorner, setAlpha(g_colour_text, 24));
					}

					if (is_focused) {
						// drawRectangle(gr, ax, ay, aw, ah, ppt.enableRoundedCorner, setAlpha(g_colour_selection, 200));
					}

					// hovered row
					this.ishover_track = this.mx > ax && this.mx < ax + aw && this.my > ay && this.my < ay + ah && this.my < this.y + this.h;
					if (this.ishover_track) {
						fillRectangle(gr, ax, ay, aw, ah, ppt.enableRoundedCorner, setAlpha(g_colour_text, 16));
					}

					// tracknumber part
					tnw = (ppt.enableGroupHeader ? "99".calc_width2(g_font) : Math.min(this.rows.length.toString().calc_width2(g_font), ah)) + M * 2;
					if (is_selected) {
						gr.WriteTextSimple(chars.check, g_font_material, g_colour_highlight, ax, ay, tnw, ah, 2, 2, 1, 1);
					} else if (is_playing) {
						this.nowplaying_y = ay;
						gr.WriteTextSimple(g_seconds % 2 == 0 ? chars.volume0 : chars.volume1, g_font_material, g_colour_highlight, ax, ay, tnw, ah, 2, 2, 1, 1);
					} else if (is_recently_added(tags.added)) {
						gr.WriteTextSimple("\u2022", g_font_group2, g_colour_highlight, ax, ay, tnw, ah, 2, 2, 1, 1);
					} else {
						gr.WriteTextSimple(ppt.enableGroupHeader ? tags.tracknumber : (i + 1), g_font, col2, ax, ay, tnw, ah, 2, 2, 1, 1);
					}

					// length part
					lw = "00:00:00".calc_width2(g_font);
					gr.WriteTextSimple(is_playing ? g_time : tags.length, g_font, col2, ax + aw - lw - M, ay, lw, ah, 1, 2, 1, 1);

					// rating part
					rw = foo_playcount ? g_rating_width : 0;
					if (this.ishover_track || tags.rating == 5 || is_selected) {
						this.rating_x = ax + aw - lw - M - rw;
						gr.WriteTextSimple(tags.rating == 5 ? chars.heart_on : chars.heart_off, g_font_material, g_colour_highlight, this.rating_x, ay, rw, ah, 2, 2);
					}

					// title, artist and album part
					var mid_width = aw - tnw - lw - rw - M;
					if (ppt.enableRowDual) {
						if (ppt.enableGroupHeader) {
							gr.WriteTextSimple(tags.title, g_font, col1, ax + tnw, ay, mid_width - M, ah * 0.5, 0, 1, 1, 1);
							gr.WriteTextSimple(tags.artist, g_font, col2, ax + tnw, ay + ah * 0.5, mid_width - M, ah * 0.5, 0, 0, 1, 1);
						} else {
							gr.WriteTextSimple(tags.title, g_font, col1, ax + tnw, ay, mid_width * 0.65, ah * 0.5, 0, 1, 1, 1);
							gr.WriteTextSimple(tags.artist, g_font, col2, ax + tnw, ay + ah * 0.5, mid_width * 0.65 - M, ah * 0.5, 0, 0, 1, 1);
							gr.WriteTextSimple(tags.album, g_font, col2, ax + tnw + mid_width * 0.65 + M, ay, mid_width * 0.35 - M * 2, ah, 0, 2, 1, 1);
						}
					} else {
						if (ppt.enableGroupHeader) {
							var w1 = (tags.track_artist === "") ? (mid_width - M) : Math.min((mid_width - M) * 0.75, tags.title.calc_width2(g_font) + 0.1); // pixel hack +0.1 to prevent text cutoff when title width is almost equal to w1
							var track_artist_x = ax + tnw + w1;
							var w2 = mid_width - M - w1;
							gr.WriteTextSimple(tags.title, g_font, col1, ax + tnw, ay, w1, ah, 0, 2, 1, 1);
							gr.WriteTextSimple(" \u2022 " + tags.track_artist, g_font, col3, track_artist_x, ay, w2, ah, 0, 2, 1, 1);
						} else {
							gr.WriteTextSimple(tags.title, g_font, col1, ax + tnw, ay, mid_width * 0.50 - M, ah, 0, 2, 1, 1);
							gr.WriteTextSimple(tags.artist, g_font, col2, ax + tnw + mid_width * 0.50, ay, mid_width * 0.25 - M, ah, 0, 2, 1, 1);
							gr.WriteTextSimple(tags.album, g_font, col2, ax + tnw + mid_width * 0.75, ay, mid_width * 0.25 - M, ah, 0, 2, 1, 1);
						}
					}
					break;
				}
			}
		} else {
			if (plman.IsAutoPlaylist(g_active_playlist)) {
				if (this.inputbox.text.length == 0) {
					this.btn_edit_query.draw(gr, (ww - images.edit_query_normal.Width) * 0.5, wh * 0.5 - images.edit_query_normal.Height);
				}
			} else if (plman.GetPlaylistItemCount(g_active_playlist) == 0) {
				this.btn_add_folder.draw(gr, (ww - images.add_folder_normal.Width) * 0.5, wh * 0.5 - images.add_folder_normal.Height);
			}

			var text = (this.inputbox.text.length > 0) ? "(˚Δ˚)b\nNothing found " : (plman.IsAutoPlaylist(g_active_playlist) ? "Autoplaylist " : "") + "<" + plman.GetPlaylistName(g_active_playlist) + "> is empty!";
			gr.WriteTextSimple(text, g_font_group1, setAlpha(g_colour_text, 100), this.x, this.y, this.w, this.h, 2, 2, 1, 1);
		}

		// scrollbar part
		this.scrollbar.draw(gr);

		// headerbar part
		this.drawHeaderBar(gr);

		// bottombar part
		this.drawBottomBar(gr);
	}

	this.drawHeaderBar = function (gr) {
		fillRectangle(gr, this.hx, this.hy, this.hw, this.hh, false, !ppt.enableDynamicColours ? window.IsDark ? 0xff202020 : 0xfff3f3f3 : g_colour_background);
		gr.FillRectangle(this.hx, this.hy + this.hh - 1, this.hw, 1, shade_colour(g_colour_background, 15));

		this.inputbox.draw(gr, this.x + this.inputbox.h + 10, (this.hh - this.inputbox.h) * 0.5);
		gr.WriteTextSimple(chars.search, g_font_material, this.inputbox.edit ? g_colour_highlight : setAlpha(g_colour_text, 100), this.inputbox.x - this.inputbox.h - 5, this.inputbox.y, this.inputbox.h, this.inputbox.h, 2, 2, 1, 1);

		if (this.inputbox.text.length) {
			this.btn_reset.draw(gr, this.inputbox.x + this.inputbox.w, this.inputbox.y);
		}

		fillRectangle(gr, this.inputbox.x - this.inputbox.h - 10, this.inputbox.y - 5, this.inputbox.w + this.inputbox.h * 2 + 20, this.inputbox.h + 10, ppt.enableRoundedCorner, setAlpha(g_colour_text, 16));
		drawRectangle(gr, this.inputbox.x - this.inputbox.h - 10, this.inputbox.y - 5, this.inputbox.w + this.inputbox.h * 2 + 20, this.inputbox.h + 10, ppt.enableRoundedCorner, this.inputbox.edit ? g_colour_highlight : 0);

		if (this.list.Count > 0) {
			var result_count = 0;
			for (i = 0; i < this.rows.length; i++) {
				if (this.inputbox.text.length) {
					this.rows[i].type == 0 && result_count++;
				}
			}
			var filter_result = "Filter out " + result_count + " item" + (result_count > 1 ? "s" : "") + " from " + this.list.Count;
			var filter_result_x = this.inputbox.x + this.inputbox.w + this.inputbox.h + 25;
			var filter_result_w = this.w - filter_result_x;
			this.inputbox.text.length && gr.WriteTextSimple(filter_result, g_font, setAlpha(g_colour_text, 150), filter_result_x, this.inputbox.y, filter_result_w, this.inputbox.h, 0, 2, 1, 1);
		}

		var w = images.prev_normal.Width;
		var h = images.prev_normal.Height;
		var x = ww - this.x;
		var y = (this.hh - h) * 0.5;

		this.btn_mode.draw(gr, x - w * 1, y);
		this.btn_pord.draw(gr, x - w * 2, y);
		this.btn_next.draw(gr, x - w * 3, y);
		this.btn_prev.draw(gr, x - w * 4, y);
		this.btn_play.draw(gr, x - w * 5, y);
	}

	this.drawBottomBar = function (gr) {
		fillRectangle(gr, this.bx, this.by, this.bw, this.bh, false, !ppt.enableDynamicColours ? window.IsDark ? 0xff202020 : 0xfff3f3f3 : g_colour_background);
		gr.FillRectangle(this.bx, this.by, this.bw, 1, shade_colour(g_colour_background, 10));
	}

	this.selectGroupTracks = function (aId) {
		var affectedItems = [];
		var group = this.groups[aId];
		if (!group) {
			return;
		}
		var end = group.start + group.count;
		for (var i = group.start; i < end; i++) {
			affectedItems.push(i);
		}
		plman.SetPlaylistSelection(g_active_playlist, affectedItems, true);
	}

	this.selectAlbumTracks = function (aId) {
		var group = this.groups[aId];
		if (!group) {
			return;
		}
		var album = group.album;
		var affectedItems = [];

		for (var g = 0; g < this.groups.length; g++) {
			var grp = this.groups[g];
			if (grp.album == album) {
				var end = grp.start + grp.count;
				for (var i = grp.start; i < end; i++) {
					affectedItems.push(i);
				}
			}
		}

		if (affectedItems.length) {
			plman.SetPlaylistSelection(g_active_playlist, affectedItems, true);
		}
	}

	this.showNowPlaying = function () {
		if (fb.IsPlaying) {
			return window.IsDefaultUI ? fb.RunMainMenuCommand("View/Show now playing") : fb.RunMainMenuCommand("View/Show now playing in playlist");
		}
	}

	this.on_mouse = function (event, x, y) {
		if (g_active_playlist == -1)
			return;

		this.activeRow = -1
		var shift = utils.IsKeyPressed(VK_SHIFT);
		var ctrl = utils.IsKeyPressed(VK_CONTROL);
		var playlistTrackId = -1;
		var rowType = -1;
		var hover = x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.h;

		if (hover) {
			var tmp = Math.ceil((y + scroll_ - this.y) / ppt.rowHeight - 1);
			if (tmp < this.rows.length && this.rows[tmp]) {
				this.activeRow = tmp;
				playlistTrackId = this.rows[tmp].playlistTrackId;
				rowType = this.rows[tmp].type;
			}
		}

		if (this.activeRow > -1) {
			this.ishover_rating = rowType == 0 && x > this.rating_x && x < this.rating_x + g_rating_width;
		} else {
			this.ishover_rating = false;
		}

		switch (event) {
		case "lbtn_dblclk":
			if (this.activeRow > -1 && !this.ishover_rating && rowType == 0) {
				play(g_active_playlist, playlistTrackId);
			}
			if (x < this.x || y < this.y || x > this.x + this.w || y > this.y + this.h) {
				return this.showNowPlaying();
			}
			break;
		case "lbtn_down":
			if (y > this.y && !this.ishover_rating) {
				if (this.activeRow > -1) {
					switch (true) {
					case rowType == 0: // ----------------> track row
						if (shift) {
							var affectedItems = [];

							if (this.old_activeRow == -1 || this.activeRow == this.old_activeRow) {
								affectedItems.push(playlistTrackId);
							} else {
								var start = Math.min(this.activeRow, this.old_activeRow);
								var end = Math.max(this.activeRow, this.old_activeRow);

								for (var i = start; i <= end; i++) {
									affectedItems.push(this.rows[i].playlistTrackId);
								}
							}

							plman.ClearPlaylistSelection(g_active_playlist);
							plman.SetPlaylistSelection(g_active_playlist, affectedItems, true);
							plman.SetPlaylistFocusItem(g_active_playlist, playlistTrackId);
						} else {
							this.old_activeRow = this.activeRow;

							if (ctrl) {
								if (plman.IsPlaylistItemSelected(g_active_playlist, playlistTrackId)) {
									plman.SetPlaylistSelectionSingle(g_active_playlist, playlistTrackId, false);
								} else {
									plman.SetPlaylistSelectionSingle(g_active_playlist, playlistTrackId, true);
								}
								plman.SetPlaylistFocusItem(g_active_playlist, playlistTrackId);
							} else if (!plman.IsPlaylistItemSelected(g_active_playlist, playlistTrackId)) {
								plman.ClearPlaylistSelection(g_active_playlist);
								plman.SetPlaylistSelectionSingle(g_active_playlist, playlistTrackId, true);
								plman.SetPlaylistFocusItem(g_active_playlist, playlistTrackId);
							}
						}
						break;
					default: // ----------------> group or disc header row
						if (!ctrl) {
							plman.ClearPlaylistSelection(g_active_playlist);
						}
						if (rowType == -1) {
							this.selectGroupTracks(this.rows[this.activeRow].albumId);
						} else {
							this.selectAlbumTracks(this.rows[this.activeRow].albumId);
						}
						plman.SetPlaylistFocusItem(g_active_playlist, playlistTrackId);
						break;
					}
				} else if (!shift && !ctrl) {
					plman.ClearPlaylistSelection(g_active_playlist);
				}
			}

			this.btn_reset.checkstate("lbtn_down", x, y);
			this.btn_play.checkstate("lbtn_down", x, y);
			this.btn_prev.checkstate("lbtn_down", x, y);
			this.btn_next.checkstate("lbtn_down", x, y);
			this.btn_pord.checkstate("lbtn_down", x, y);
			this.btn_mode.checkstate("lbtn_down", x, y);
			this.btn_add_folder.checkstate("lbtn_down", x, y);
			this.btn_edit_query.checkstate("lbtn_down", x, y);
			break;
		case "lbtn_up":
			if (this.ishover_rating && this.rows[this.activeRow].metadb) {
				var handles = fb.CreateHandleList(this.rows[this.activeRow].metadb);

				if (foo_playcount) {
					if (this.rows[this.activeRow].tags.rating != 5) {
						handles.RunContextCommand("Playback Statistics/Rating/" + 5);
					} else {
						handles.RunContextCommand("Playback Statistics/Rating/<not set>");
					}
				} else {
					var rp = this.rows[this.activeRow].metadb.RawPath;
					if (rp.indexOf("file://") == 0 || rp.indexOf("cdda://") == 0) {
						if (this.rows[this.activeRow].tags.rating != 5) {
							handles.RunContextCommand("Playback Statistics/Rating/" + 5);
						} else {
							handles.UpdateFileInfoFromJSON(JSON.stringify({"RATING" : ""}));
						}
					}
				}

				handles.Dispose();
			} else {
				if (shift || ctrl) {
					// do nothing
				} else if (this.activeRow > -1) {
					if (rowType == 0) { // ----------------> track row
						plman.ClearPlaylistSelection(g_active_playlist);
						plman.SetPlaylistSelectionSingle(g_active_playlist, playlistTrackId, true);
						plman.SetPlaylistFocusItem(g_active_playlist, playlistTrackId);
					}
				}
			}

			if (this.btn_reset.checkstate("lbtn_up", x, y) == ButtonStates.hover) {
				clear_search();
			}
			if (this.btn_play.checkstate("lbtn_up", x, y) == ButtonStates.hover) {
				fb.PlayOrPause();
			}
			if (this.btn_prev.checkstate("lbtn_up", x, y) == ButtonStates.hover) {
				fb.Prev();
			}
			if (this.btn_next.checkstate("lbtn_up", x, y) == ButtonStates.hover) {
				fb.Next();
			}
			if (this.btn_pord.checkstate("lbtn_up", x, y) == ButtonStates.hover) {
				this.playback_order_changed();
			}
			if (this.btn_mode.checkstate("lbtn_up", x, y) == ButtonStates.hover) {
				if (window.IsDefaultUI) {
					return;
				} else {
					fb.RunMainMenuCommand("View/Mode/Switch to other mode");
				}
			}
			if (plman.GetPlaylistItemCount(g_active_playlist) == 0 && hover) {
				if (plman.IsAutoPlaylist(g_active_playlist)) {
					if (this.btn_edit_query.checkstate("lbtn_up", x, y) == ButtonStates.hover) {
						plman.ShowAutoPlaylistUI(g_active_playlist);
					}
				} else {
					if (this.btn_add_folder.checkstate("lbtn_up", x, y) == ButtonStates.hover) {
						fb.AddDirectory();
					}
				}
			}
			break;
		case "leave":
			break;
		case "move":
			// grab moving mouse location
			this.mx = x;
			this.my = y;

			this.btn_reset.checkstate("move", x, y);
			this.btn_play.checkstate("move", x, y);
			this.btn_prev.checkstate("move", x, y);
			this.btn_next.checkstate("move", x, y);
			this.btn_pord.checkstate("move", x, y);
			this.btn_mode.checkstate("move", x, y);
			this.btn_add_folder.checkstate("move", x, y);
			this.btn_edit_query.checkstate("move", x, y);
			break;
		case "rbtn_up":
			var is_group_header = false;
			if (hover) {
				if (this.activeRow > -1) {
					switch (true) {
					case rowType == 0: // ----------------> track row
						if (!plman.IsPlaylistItemSelected(g_active_playlist, playlistTrackId)) {
							plman.ClearPlaylistSelection(g_active_playlist);
							plman.SetPlaylistSelectionSingle(g_active_playlist, playlistTrackId, true);
							plman.SetPlaylistFocusItem(g_active_playlist, playlistTrackId);
						}
						break;
					default: // ----------------> group or disc header row
						if (!plman.IsPlaylistItemSelected(g_active_playlist, playlistTrackId)) {
							plman.ClearPlaylistSelection(g_active_playlist);
							if (rowType == -1) {
								this.selectGroupTracks(this.rows[this.activeRow].albumId);
							} else {
								this.selectAlbumTracks(this.rows[this.activeRow].albumId);
							}
							plman.SetPlaylistFocusItem(g_active_playlist, playlistTrackId);
						}
						is_group_header = true;
						break;
					}
				} else {
					plman.ClearPlaylistSelection(g_active_playlist);
				}
			}
			if (hover && this.list.Count > 0 && !this.inputbox.hover) {
				this.context_menu(x, y, true);
			}
			break;
		}

		if (this.list.Count > 0) {
			this.inputbox.check(event, x, y);

			if (this.inputbox.text.length > 0) {
				if (event == "lbtn_down" || event == "move") {
					this.btn_reset.checkstate(event, x, y);
				} else if (event == "lbtn_up") {
					if (this.btn_reset.checkstate("lbtn_up", x, y) == ButtonStates.hover) {
						this.inputbox.text = "";
						this.inputbox.offset = 0;
						g_sendResponse();
					}
				}
			}
		}

		if (cScrollBar.visible) {
			this.scrollbar.on_mouse(event, x, y);
		}

		if (event) {
			brw.repaint();
		}
	}

	this.context_menu = function (x, y, is_group_header) {
		var menu = window.CreatePopupMenu();
		var context = fb.CreateContextMenuManager();
		var selected_items = plman.GetPlaylistSelectedItems(g_active_playlist);

		var sub1 = window.CreatePopupMenu();
		var sub2 = window.CreatePopupMenu();
		var sub3 = window.CreatePopupMenu();

		// settings start
		if (!is_group_header) {
			var colour_flag = EnableMenuIf(ppt.enableCustomColours);
			sub1.AppendMenuItem(CheckMenuIf(ppt.enableDynamicColours), 2, "Dynamic colours");
			sub1.AppendMenuItem(CheckMenuIf(ppt.enableCustomColours), 3, "Custom colours");
			sub1.AppendMenuSeparator();
			sub1.AppendMenuItem(colour_flag, 4, "Text");
			sub1.AppendMenuItem(colour_flag, 5, "Background");
			sub1.AppendMenuItem(colour_flag, 6, "Selected background");
			sub1.AppendTo(menu, MF_STRING, "Colours");
			menu.AppendMenuSeparator();

			sub2.AppendMenuItem(MF_STRING, 10, "None");
			sub2.AppendMenuItem(MF_STRING, 11, "Front cover of playing track");
			sub2.AppendMenuItem(MF_STRING, 12, "Custom image");
			sub2.CheckMenuRadioItem(10, 12, ppt.wallpapermode + 10);
			sub2.AppendMenuSeparator();
			sub2.AppendMenuItem(EnableMenuIf(ppt.wallpapermode == 2), 13, "Custom image path...");
			sub2.AppendMenuSeparator();
			sub2.AppendMenuItem(GetMenuFlags(ppt.wallpapermode != 0, ppt.wallpaperblurred), 14, "Blur");
			sub2.AppendTo(menu, MF_STRING, "Background Wallpaper");

			menu.AppendMenuItem(CheckMenuIf(ppt.enableGroupBackground), 15, "Group Background");
			menu.AppendMenuItem(CheckMenuIf(ppt.enableGroupHeader), 16, "Group Header\tCtrl+G");
			menu.AppendMenuItem(CheckMenuIf(ppt.enableRowDual), 17, "Row Dual\tCtrl+D");
			menu.AppendMenuItem(CheckMenuIf(ppt.enableRowStripe), 18, "Row Stripe\tCtrl+E");
			menu.AppendMenuSeparator();
			menu.AppendMenuItem(MF_STRING, 19, "Reset cover cache\tF5");
			menu.AppendMenuItem(MF_STRING, 20, "Reset settings");
		}
		// settings end

		if (x > this.x && x < this.x + this.w && y > this.y) {
			var remove_flag = EnableMenuIf(playlist_can_remove_items(g_active_playlist));
			var paste_flag = EnableMenuIf(!is_group_header && playlist_can_add_items(g_active_playlist) && fb.CheckClipboardContents());

			if (this.activeRow > -1) {
				menu.AppendMenuItem(remove_flag, 101, "Crop");
				menu.AppendMenuItem(remove_flag, 102, "Remove");
				menu.AppendMenuSeparator();
				menu.AppendMenuItem(remove_flag, 103, "Cut");
				menu.AppendMenuItem(MF_STRING, 104, "Copy");
				menu.AppendMenuItem(paste_flag, 105, "Paste");
				menu.AppendMenuSeparator();

				sub3.AppendMenuItem(MF_STRING, 110, "New Playlist");
				if (plman.PlaylistCount > 0) {
					sub3.AppendMenuSeparator();
				}
				for (var i = 0; i < plman.PlaylistCount; i++) {
					sub3.AppendMenuItem(EnableMenuIf(i != g_active_playlist && playlist_can_add_items(i)), 200 + i, plman.GetPlaylistName(i));
				}
				sub3.AppendTo(menu, MF_STRING, "Add to");
				menu.AppendMenuSeparator();

				context.InitContextPlaylist();
				context.BuildMenu(menu, 1000);
			} else {
				menu.AppendMenuItem(paste_flag, 107, "Paste");
			}
		}

		var idx = menu.TrackPopupMenu(x, y);
		menu.Dispose();

		switch (idx) {
		case 0:
			break;
		case 1:
			break;
		case 2:
			ppt.enableDynamicColours = !ppt.enableDynamicColours;
			window.SetProperty("SMOOTH.DYNAMIC.COLOURS.ENABLED", ppt.enableDynamicColours);
			on_colours_changed();
			break
		case 3:
			ppt.enableCustomColours = !ppt.enableCustomColours;
			window.SetProperty("SMOOTH.CUSTOM.COLOURS.ENABLED", ppt.enableCustomColours);
			on_colours_changed();
			break;
		case 4:
			g_colour_text = utils.ColourPicker(g_colour_text);
			window.SetProperty("SMOOTH.COLOUR.TEXT", g_colour_text);
			on_colours_changed();
			break;
		case 5:
			g_colour_background = utils.ColourPicker(g_colour_background);
			window.SetProperty("SMOOTH.COLOUR.BACKGROUND.NORMAL", g_colour_background);
			on_colours_changed();
			break;
		case 6:
			g_colour_selection = utils.ColourPicker(g_colour_selection);
			window.SetProperty("SMOOTH.COLOUR.BACKGROUND.SELECTED", g_colour_selection);
			on_colours_changed();
			break;
		case 10:
		case 11:
		case 12:
			ppt.wallpapermode = idx - 10;
			window.SetProperty("SMOOTH.WALLPAPER.MODE", ppt.wallpapermode);
			setWallpaperImg();
			this.repaint();
			break;
		case 13:
			var tmp = utils.InputBox("Enter the full path to an image.", window.Name, ppt.wallpaperpath);
			if (tmp != ppt.wallpaperpath) {
				ppt.wallpaperpath = tmp;
				window.SetProperty("SMOOTH.WALLPAPER.PATH", ppt.wallpaperpath);
				setWallpaperImg();
				this.repaint();
			}
			break;
		case 14:
			ppt.wallpaperblurred = !ppt.wallpaperblurred;
			window.SetProperty("SMOOTH.WALLPAPER.BLURRED", ppt.wallpaperblurred);
			setWallpaperImg();
			this.repaint();
			break;
		case 15:
			ppt.enableGroupBackground = !ppt.enableGroupBackground;
			window.SetProperty("SMOOTH.GROUP.BACKGROUND.ENABLED", ppt.enableGroupBackground);
			this.repaint();
			break;
		case 16:
			ppt.enableGroupHeader = !ppt.enableGroupHeader;
			window.SetProperty("SMOOTH.GROUP.HEADER.ENABLED", ppt.enableGroupHeader);
			get_metrics();
			this.repaint();
			brw.showNowPlaying();
			break;
		case 17:
			ppt.enableRowDual = !ppt.enableRowDual;
			window.SetProperty("SMOOTH.ROW.DUAL.ENABLED", ppt.enableRowDual)
			get_metrics();
			this.repaint();
			brw.showNowPlaying();
			break;
		case 18:
			ppt.enableRowStripe = !ppt.enableRowStripe;
			window.SetProperty("SMOOTH.ROW.STRIPE.ENABLED", ppt.enableRowStripe)
			get_metrics();
			this.repaint();
			brw.showNowPlaying();
			break;
		case 19:
			utils.RemoveFolderRecursive(CACHE_FOLDER, 1);
			images.clear();
			this.populate();
			break;
		case 20:
			window.Reload(true);
			break;
		case 101:
			plman.UndoBackup(g_active_playlist);
			plman.RemovePlaylistSelection(g_active_playlist, true);
			break;
		case 102:
			plman.UndoBackup(g_active_playlist);
			plman.RemovePlaylistSelection(g_active_playlist);
			break;
		case 103:
			selected_items.CopyToClipboard();
			plman.UndoBackup(g_active_playlist);
			plman.RemovePlaylistSelection(g_active_playlist);
			break;
		case 104:
			selected_items.CopyToClipboard();
			break;
		case 105:
			this.paste_items(getFocusId() + 1);
			break;
		case 106:
			this.paste_items(plman.GetPlaylistItemCount(g_active_playlist));
			break;
		case 110:
			var pl = plman.CreatePlaylist();
			g_active_playlist = pl;
			plman.InsertPlaylistItems(pl, 0, selected_items);
			break;
		default:
			if (idx < 1000) {
				var pl = idx - 200;
				plman.UndoBackup(pl);
				plman.InsertPlaylistItems(pl, plman.GetPlaylistItemCount(pl), selected_items);
			} else {
				context.ExecuteByID(idx - 1000);
			}
			break;
		}

		selected_items.Dispose();
		context.Dispose();
		return true;
	}

	this.paste_items = function (pos) {
		var clipboard_contents = fb.GetClipboardContents();
		plman.UndoBackup(g_active_playlist);
		plman.InsertPlaylistItems(g_active_playlist, pos, clipboard_contents);
		clipboard_contents.Dispose();
	}

	this.playback_order_changed = function () {
		switch (true) {
			case (plman.PlaybackOrder < 1):
				plman.PlaybackOrder = 1;
				break;
			case (plman.PlaybackOrder === 1):
				plman.PlaybackOrder = 2;
				break;
			case (plman.PlaybackOrder === 2):
				plman.PlaybackOrder = 4;
				break;
			default:
				plman.PlaybackOrder = 1;
		}
	}

	window.SetInterval(function () {
		if (!window.IsVisible) {
			need_repaint = true;
			return;
		}

		if (m_y > brw.y && m_y < brw.y + brw.h) {
			brw.activeRow = Math.ceil((m_y + scroll_ - brw.y) / ppt.rowHeight - 1);
			if (brw.activeRow >= brw.rows.length)
				brw.activeRow = -1;
		} else {
			brw.activeRow = -1;
		}

		scroll = check_scroll(scroll);
		if (Math.abs(scroll - scroll_) >= 1) {
			scroll_ += (scroll - scroll_) / ppt.scrollSmoothness;
			need_repaint = true;
			isScrolling = true;
			if (scroll_prev != scroll)
				brw.scrollbar.updateScrollbar();
		} else {
			if (isScrolling) {
				if (scroll_ < 1)
					scroll_ = 0;
				isScrolling = false;
				need_repaint = true;
			}
		}
		if (need_repaint) {
			need_repaint = false;
			window.RepaintRect(0, 0, ww, brw.hh + brw.h);
			// window.Repaint();
		}

		scroll_prev = scroll;

	}, ppt.refreshRate);

	window.SetTimeout(function () {
		brw.populate();
		brw.showFocusedItem();
	}, 100);

	this.groups = [];
	this.rows = [];
	this.scrollbar = new oScrollbar(this);
	this.playlist_info = "";
	this.list = fb.CreateHandleList();
	this.track_tf_arr = [];
	this.old_activeRow = -1;
	this.nowplaying_y = 0;
	this.inputbox = new oInputbox(true, "", "Filter playlist (F3)", g_sendResponse, this);
}

function oGroup(index, start, handle, groupkey, cachekey) {
	this.index = index;
	this.start = start;
	this.count = 1;
	this.total_time_length = 0;
	this.total_group_duration_txt = "";
	this.metadb = handle;
	this.groupkey = groupkey;
	this.cachekey = cachekey;
	this.cover_image = null;
	this.dominant = 0;
	this.image_requested = false;

	var arr = this.groupkey.split(" ^^ ");
	this.album = arr[0];
	this.artist = arr[1];
	this.date = format_date(arr[2].slice(0, 10));
	this.copyright = arr[3]; // copyright/url/genre
	this.totaltracks = arr[4];
	this.discnumber = parseInt(arr[5], 10);
	this.totaldiscs = parseInt(arr[6], 10);
	this.groupkey = null; // freed after parsing

	this.finalise = function (count, total_time_length) {
		this.count = count;
		this.total_time_length = total_time_length;
		this.total_group_duration_txt = utils.FormatDuration(total_time_length);
	}
}

function g_sendResponse() {
	g_search_text = brw.inputbox.text;
	g_search_index = 0;

	if (g_search_text.empty()) {
		plman.ClearPlaylistSelection(g_active_playlist);
		g_search_indexes = [];
	} else {
		g_search_indexes = plman.SelectQueryItems(g_active_playlist, g_search_text).toArray();
	}
	brw.populate();
}

function clear_search() {
	brw.inputbox.text = "";
	g_search_index = 0;
	g_search_indexes = [];
	g_sendResponse();
	brw.showNowPlaying();
}

function kill_scrollbar_timer() {
	cScrollBar.timerCounter = -1;

	if (cScrollBar.timerID) {
		window.ClearTimeout(cScrollBar.timerID);
		cScrollBar.timerID = false;
	}
}

function vk_up() {
	var scrollstep = 1;
	var new_focus_id = 0;
	var new_row = 0;

	new_row = g_focus_row - scrollstep;

	if (new_row < 0) {
		if (ppt.enableGroupHeader) {
			new_row = ppt.groupHeaderRowsNumber;
		} else {
			new_row = 0;
		}
		kill_scrollbar_timer();
	} else {
		if (brw.rows[new_row].type != 0) {
			new_row -= ppt.groupHeaderRowsNumber;
		}

		if (new_row >= 0) {
			new_focus_id = brw.rows[new_row].playlistTrackId;
			plman.ClearPlaylistSelection(g_active_playlist);
			plman.SetPlaylistSelectionSingle(g_active_playlist, new_focus_id, true);
			plman.SetPlaylistFocusItem(g_active_playlist, new_focus_id);
		}
	}
}

function vk_down() {
	var scrollstep = 1;
	var new_focus_id = 0;
	var new_row = 0;

	new_row = g_focus_row + scrollstep;

	if (new_row > brw.rows.length - 1) {
		new_row = brw.rows.length - 1;
		kill_scrollbar_timer();
	} else {
		if (brw.rows[new_row].type != 0) {
			if (brw.rows[new_row].type <= 1) {
				new_row += ppt.groupHeaderRowsNumber;
			}
		}

		if (new_row < brw.rows.length) {
			new_focus_id = brw.rows[new_row].playlistTrackId;
			plman.ClearPlaylistSelection(g_active_playlist);
			plman.SetPlaylistSelectionSingle(g_active_playlist, new_focus_id, true);
			plman.SetPlaylistFocusItem(g_active_playlist, new_focus_id);
		}
	}
}

function get_metrics() {
	if (ppt.enableRowDual) {
		ppt.rowHeight = Math.floor(g_font_height * 3);
	} else {
		ppt.rowHeight = Math.floor(g_font_height * 2);
	}

	ppt.headerBarHeight = g_font_height * 4.0;

	brw.setSize();
	brw.setList();
}

function on_colours_changed() {
	get_colours();
	brw.scrollbar.setNewColours();
	brw.repaint();
}

function on_font_changed() {
	get_font();
	get_metrics();
	brw.repaint();
}

function on_size() {
	ww = window.Width;
	wh = window.Height;
	brw.setSize();

	var menu_commands = JSON.parse(fb.EnumerateMainMenuCommands());

	for (var i = 0; i < menu_commands.length; i++) {
		// DUI hacks
		if (window.IsDefaultUI && fb.CheckComponent("foo_openhacks")) {
			if (menu_commands[i].FullPath == "View/Show status bar" && menu_commands[i].Checked) {
				fb.RunMainMenuCommand("View/Show status bar");
				break;
			}
		// CUI hacks
		} else {
			if (menu_commands[i].FullPath == "View/Show status pane" && menu_commands[i].Checked) {
				fb.RunMainMenuCommand("View/Show status pane");
				break;
			}
			if (menu_commands[i].FullPath == "View/Show status bar" && menu_commands[i].Checked) {
				fb.RunMainMenuCommand("View/Show status bar");
				break;
			}
		}
	}
}

function on_paint(gr) {
	brw.draw(gr);
}

function check_scroll(scroll___) {
	if (scroll___ < 0) {
		scroll___ = 0;
	}

	var g1 = brw.h - (brw.totalRowsVis * ppt.rowHeight);
	var end_limit = (brw.rows.length * ppt.rowHeight) - (brw.totalRowsVis * ppt.rowHeight) - g1;

	if (scroll___ != 0 && scroll___ > end_limit) {
		scroll___ = end_limit;
	}

	return isNaN(scroll___) ? 0 : scroll___;
}

function getFocusId() {
	return plman.GetPlaylistFocusItemIndex(g_active_playlist);
}

ppt.groupHeaderRowsNumber = ppt.rowScrollStep;
ppt.enableGroupBackground = window.GetProperty("SMOOTH.GROUP.BACKGROUND.ENABLED", true);
ppt.enableGroupHeader = window.GetProperty("SMOOTH.GROUP.HEADER.ENABLED", true);
ppt.enableRoundedCorner = window.GetProperty("SMOOTH.ROUNDED.CORNER.ENABLED", true);
ppt.enableRowDual = window.GetProperty("SMOOTH.ROW.DUAL.ENABLED", false);
ppt.enableRowStripe = window.GetProperty("SMOOTH.ROW.STRIPE.ENABLED", true);

ppt.time_tf = "$if3(-%playback_time_remaining%,%playback_time%,)";
ppt.track_tf = "$if2([%artist%],N/A) ^^ [%title%] ^^ [%genre%] ^^ [%album%] ^^ $if2($num([%tracknumber%],1),00) ^^ [%length%] ^^ $if2(%rating%,0) ^^ [%play_count%] ^^ [%added%] ^^ [%track artist%]";
ppt.groupkey_tf = "$if2(%album%,$if(%length%,'('Singles')',%title%)) ^^ $if2(%album artist%,$if(%length%,%directory%,N/A)) ^^ $if2([%date%],N/A) ^^ $if3([%copyright%],[%url%],[%genre%]) ^^ $num([%totaltracks%],1) ^^ $if2(%discnumber%,1) ^^ $if2(%totaldiscs%,1)";

var tfo = {
	time: fb.TitleFormat(ppt.time_tf),
	track: fb.TitleFormat(ppt.track_tf),
	groupkey: fb.TitleFormat(ppt.groupkey_tf),
};

var foo_playcount = fb.CheckComponent("foo_playcount");

var g_focus_id = getFocusId();
var g_focus_row = 0;
var g_focus_album_id = -1;
var g_seconds = 0;
var g_time = "";
var g_search_text = "";
var g_search_index = 0;
var g_search_indexes = [];

var brw = new oBrowser();

get_metrics();
setWallpaperImg();
