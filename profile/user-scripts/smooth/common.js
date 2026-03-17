function on_get_album_art_done(metadb, art_id, image) {
	if (!image)
		return;

	for (var i = 0; i < brw.groups.length; i++) {
		if (brw.groups[i].metadb && brw.groups[i].metadb.Compare(metadb)) {
			var cached_filename = generate_filename(brw.groups[i].cachekey, art_id);
			image.SaveAs(cached_filename);
			images.cache[cached_filename] = image;
			brw.groups[i].cover_image = image;
			brw.repaint();
			break;
		}
	}
}

function clamp(value, min, max) {
	if (value < min)
		return min;
	else if (value > max)
		return max;
	else
		return value;
}

function format_date(str) {
	if (!str || str.length < 10) return str;
	
	var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	var parts = str.split("-");
	if (parts.length < 3) return str;
	
	var year = parseInt(parts[0]);
	var month = parseInt(parts[1]) - 1;
	var day = parseInt(parts[2]);
	
	if (month < 0 || month > 11 || day < 1 || day > 31) return str;
	
	return months[month] + " " + day + ", " + year;
}

function is_recently_added(date) {
	if (!date || typeof date !== "string") {
		return;
	}

	// parse the date string format: YYYY-MM-DD HH:MM:SS
	var parts = date.split(" ");
	if (parts.length < 2) {
		return;
	}

	var dd = parts[0].split("-"); // date parts
	var tt = parts[1].split(":"); // time parts

	if (dd.length < 3 || tt.length < 3) {
		return;
	}

	var providedDate = new Date(parseInt(dd[0]), parseInt(dd[1]) - 1, parseInt(dd[2]), parseInt(tt[0]), parseInt(tt[1]), parseInt(tt[2]));
	var currentDate = new Date();
	var recentlyAdded = new Date(currentDate.getTime() - (7 * 24 * 60 * 60 * 1000));

	return providedDate >= recentlyAdded && providedDate <= currentDate;
}

function update_extra_font_size(step) {
	var tmp = clamp(ppt.fontSize + step, ppt.fontSizes[0], ppt.fontSizes[ppt.fontSizes.length - 1]);

	if (ppt.fontSize != tmp) {
		ppt.fontSize = tmp;
		window.SetProperty("SMOOTH.FONT.SIZE", ppt.fontSize);
		get_font();
		get_metrics();
		get_images();
		window.Repaint();
	}
}

function get_images() {
	var gb;
	var size = M * 2;
	var font_normal = smooth_font("Material Icons", size * 0.20);
	var font_hover = smooth_font("Material Icons", size * 0.25);
	var colour_normal = setAlpha(g_colour_text, 150);
	var colour_hover = g_colour_text;
	var colour_block = window.IsDark ? shade_colour(g_colour_text, 80) : tint_colour(g_colour_text, 80);

	// reset
	images.reset_normal = utils.CreateImage(size, size);
	gb = images.reset_normal.GetGraphics();
	gb.WriteTextSimple(chars.close, font_normal, colour_normal, 0, 0, size, size, 2, 2);
	images.reset_normal.ReleaseGraphics();

	images.reset_hover = utils.CreateImage(size, size);
	gb = images.reset_hover.GetGraphics();
	gb.WriteTextSimple(chars.close, font_hover, colour_hover, 0, 0, size, size, 2, 2);
	images.reset_hover.ReleaseGraphics();

	// play
	var char = fb.IsPlaying ? !fb.IsPlaying || fb.IsPaused ? chars.play : chars.pause : chars.stop;
	images.play_normal = utils.CreateImage(size, size);
	gb = images.play_normal.GetGraphics();
	gb.WriteTextSimple(char, font_normal, colour_normal, 0, 0, size, size, 2, 2);
	images.play_normal.ReleaseGraphics();

	images.play_hover = utils.CreateImage(size, size);
	gb = images.play_hover.GetGraphics();
	fillRectangle(gb, 0, 0, size, size, true, setAlpha(g_colour_text, 16));
	gb.WriteTextSimple(char, font_hover, colour_hover, 0, 0, size, size, 2, 2);
	images.play_hover.ReleaseGraphics();

	// prev
	images.prev_normal = utils.CreateImage(size, size);
	gb = images.prev_normal.GetGraphics();
	gb.WriteTextSimple(chars.prev, font_normal, colour_normal, 0, 0, size, size, 2, 2);
	images.prev_normal.ReleaseGraphics();

	images.prev_hover = utils.CreateImage(size, size);
	gb = images.prev_hover.GetGraphics();
	fillRectangle(gb, 0, 0, size, size, true, setAlpha(g_colour_text, 16));
	gb.WriteTextSimple(chars.prev, font_hover, colour_hover, 0, 0, size, size, 2, 2);
	images.prev_hover.ReleaseGraphics();

	// next
	images.next_normal = utils.CreateImage(size, size);
	gb = images.next_normal.GetGraphics();
	gb.WriteTextSimple(chars.next, font_normal, colour_normal, 0, 0, size, size, 2, 2);
	images.next_normal.ReleaseGraphics();

	images.next_hover = utils.CreateImage(size, size);
	gb = images.next_hover.GetGraphics();
	fillRectangle(gb, 0, 0, size, size, true, setAlpha(g_colour_text, 16));
	gb.WriteTextSimple(chars.next, font_hover, colour_hover, 0, 0, size, size, 2, 2);
	images.next_hover.ReleaseGraphics();

	// playback order
	var pord = plman.PlaybackOrder;
	var pord_char = pord == 4 ? chars.shuffle : pord == 2 ? chars.repeat_one : chars.repeat_all;

	images.pord_normal = utils.CreateImage(size, size);
	gb = images.pord_normal.GetGraphics();
	gb.WriteTextSimple(pord_char, font_normal, pord !== 1 ? g_colour_highlight : colour_normal, 0, 0, size, size, 2, 2);
	images.pord_normal.ReleaseGraphics();

	images.pord_hover = utils.CreateImage(size, size);
	gb = images.pord_hover.GetGraphics();
	fillRectangle(gb, 0, 0, size, size, true, setAlpha(g_colour_text, 16));
	gb.WriteTextSimple(pord_char, font_hover, pord !== 1 ? g_colour_highlight : colour_hover, 0, 0, size, size, 2, 2);
	images.pord_hover.ReleaseGraphics();

	// dark/light mode in CUI
	images.mode_normal = utils.CreateImage(size, size);
	gb = images.mode_normal.GetGraphics();
	gb.WriteTextSimple(window.IsDark ? chars.light : chars.dark, font_normal, window.IsDefaultUI ? colour_block : colour_normal, 0, 0, size, size, 2, 2);
	images.mode_normal.ReleaseGraphics();

	images.mode_hover = utils.CreateImage(size, size);
	gb = images.mode_hover.GetGraphics();
	if (window.IsDefaultUI) {
	} else {
		fillRectangle(gb, 0, 0, size, size, true, setAlpha(g_colour_text, 16));
	}
	gb.WriteTextSimple(window.IsDark ? chars.light : chars.dark, window.IsDefaultUI ? font_normal : font_hover, window.IsDefaultUI ? colour_block : colour_hover, 0, 0, size, size, 2, 2);
	images.mode_hover.ReleaseGraphics();

	// add folder in empty normal playlist
	var add_folder_text = "Add Folder";
	var add_folder_width = add_folder_text.calc_width2(g_font) + M * 2;
	var bh = g_font_height * 2;

	images.add_folder_normal = utils.CreateImage(add_folder_width, bh);
	gb = images.add_folder_normal.GetGraphics();
	fillRectangle(gb, 0, 0, add_folder_width, bh, true, setAlpha(g_colour_text, 16));
	gb.WriteTextSimple(add_folder_text, g_font, g_colour_text, 0, 0, add_folder_width, bh, 2, 2);
	images.add_folder_normal.ReleaseGraphics();

	images.add_folder_hover = utils.CreateImage(add_folder_width, bh);
	gb = images.add_folder_hover.GetGraphics();
	fillRectangle(gb, 0, 0, add_folder_width, bh, true, setAlpha(g_colour_text, 32));
	gb.WriteTextSimple(add_folder_text, g_font, g_colour_text, 0, 0, add_folder_width, bh, 2, 2);
	images.add_folder_hover.ReleaseGraphics();

	images.add_folder_down = utils.CreateImage(add_folder_width, bh);
	gb = images.add_folder_down.GetGraphics();
	fillRectangle(gb, 0, 0, add_folder_width, bh, true, setAlpha(g_colour_text, 48));
	gb.WriteTextSimple(add_folder_text, g_font, g_colour_text, 0, 0, add_folder_width, bh, 2, 2);
	images.add_folder_down.ReleaseGraphics();

	// edit query in empty autoplaylist
	var edit_query_text = "Edit Query";
	var edit_query_width = edit_query_text.calc_width2(g_font) + M * 2;

	images.edit_query_normal = utils.CreateImage(edit_query_width, bh);
	gb = images.edit_query_normal.GetGraphics();
	fillRectangle(gb, 0, 0, edit_query_width, bh, true, setAlpha(g_colour_text, 16));
	gb.WriteTextSimple(edit_query_text, g_font, g_colour_text, 0, 0, edit_query_width, bh, 2, 2);
	images.edit_query_normal.ReleaseGraphics();

	images.edit_query_hover = utils.CreateImage(edit_query_width, bh);
	gb = images.edit_query_hover.GetGraphics();
	fillRectangle(gb, 0, 0, edit_query_width, bh, true, setAlpha(g_colour_text, 32));
	gb.WriteTextSimple(edit_query_text, g_font, g_colour_text, 0, 0, edit_query_width, bh, 2, 2);
	images.edit_query_hover.ReleaseGraphics();

	images.edit_query_down = utils.CreateImage(edit_query_width, bh);
	gb = images.edit_query_down.GetGraphics();
	fillRectangle(gb, 0, 0, edit_query_width, bh, true, setAlpha(g_colour_text, 48));
	gb.WriteTextSimple(edit_query_text, g_font, g_colour_text, 0, 0, edit_query_width, bh, 2, 2);
	images.edit_query_down.ReleaseGraphics();

	// force re-creation of buttons with new colours
	if (typeof brw == 'object') brw.setSize();
}

function validate_indexes(playlist, item) {
	return playlist >= 0 && playlist < plman.PlaylistCount && item >= 0 && item < plman.GetPlaylistItemCount(playlist);
}

function play(playlist, item) {
	if (validate_indexes(playlist, item)) {
		plman.ExecutePlaylistDefaultAction(playlist, item);
	}
}

function generate_filename(cachekey, art_id) {
	var prefix = art_id == 4 ? "artist" : "front";
	return CACHE_FOLDER + prefix + cachekey/* + ".jpg"*/;
}

function get_art(metadb, cachekey, art_id) {
	var filename = generate_filename(cachekey, art_id);
	var img = images.cache[filename];

	if (img)
		return img;

	img = utils.LoadImage(filename);

	if (img) {
		images.cache[filename] = img;
		return img;
	}

	window.SetTimeout(function () {
		metadb.GetAlbumArtThumbAsync(window.ID, art_id);
	}, 10);

	return img;
}

function get_dominant_colour(img, cachekey) {
	if (!img || !cachekey)
		return 0;
	
	if (images.dominantColours[cachekey])
		return images.dominantColours[cachekey];
	
	var colours = img.GetColourScheme(8).toArray();
	var dominant = 0;
	for (var i = 0; i < colours.length; i++) {
		if (!is_close_to_grayscale(colours[i])) {
			dominant = colours[i];
			break;
		}
	}
	dominant = dominant || colours[0];
	images.dominantColours[cachekey] = dominant;
	return dominant;
}

function drawImage(gr, img, dst_x, dst_y, dst_w, dst_h, auto_fill, opacity, border, round) {
	if (!img || !dst_w || !dst_h)
		return;

	var rounded_mask = utils.CreateImage(img.Width, img.Height);
	var temp_gr = rounded_mask.GetGraphics();
	temp_gr.FillRoundedRectangle(0, 0, img.Width, img.Height, img.Width * 0.05, img.Height * 0.05, 0xff000000);
	rounded_mask.ReleaseGraphics();
	temp_gr = null;

	if (auto_fill) {
		if (img.Width / img.Height < dst_w / dst_h) {
			var src_x = 0;
			var src_w = img.Width;
			var src_h = Math.round(dst_h * img.Width / dst_w);
			var src_y = Math.round((img.Height - src_h) / 2);
		} else {
			var src_y = 0;
			var src_w = Math.round(dst_w * img.Height / dst_h);
			var src_h = img.Height;
			var src_x = Math.round((img.Width - src_w) / 2);
		}
		if (round) {
			gr.DrawImageWithMask(img, rounded_mask, dst_x, dst_y, dst_w, dst_h);
			gr.DrawRoundedRectangle(dst_x, dst_y, dst_w, dst_h, dst_w * 0.05, dst_h * 0.05, 1, border);
		} else {
			gr.DrawImage(img, dst_x, dst_y, dst_w, dst_h, src_x + 3, src_y + 3, src_w - 6, src_h - 6, opacity || 1);
			gr.DrawRectangle(dst_x, dst_y, dst_w, dst_h, 1, border);
		}
	} else {
		var s = Math.min(dst_w / img.Width, dst_h / img.Height);
		var w = Math.floor(img.Width * s);
		var h = Math.floor(img.Height * s);
		dst_x += Math.round((dst_w - w) / 2);
		dst_y += Math.round((dst_h - h) / 2);
		dst_w = w;
		dst_h = h;
		if (round) {
			gr.DrawImageWithMask(img, rounded_mask, dst_x, dst_y, dst_w, dst_h);
			gr.DrawRoundedRectangle(dst_x, dst_y, dst_w, dst_h, dst_w * 0.05, dst_h * 0.05, 1, border);
		} else {
			gr.DrawImage(img, dst_x, dst_y, dst_w, dst_h, 0, 0, img.Width, img.Height, opacity || 1);
			gr.DrawRectangle(dst_x, dst_y, dst_w, dst_h, 1, border);
		}
	}
}

function drawBackground(gr) {
	gr.Clear(g_colour_background);

	if (!ppt.wallpapermode || !g_wallpaperImg) 
		return;

	if (g_wallpaperImg.Width / g_wallpaperImg.Height < ww / wh) {
		var src_x = 0;
		var src_w = g_wallpaperImg.Width;
		var src_h = Math.round(wh * g_wallpaperImg.Width / ww);
		var src_y = Math.round((g_wallpaperImg.Height - src_h) / 2);
	} else {
		var src_y = 0;
		var src_w = Math.round(ww * g_wallpaperImg.Height / wh);
		var src_h = g_wallpaperImg.Height;
		var src_x = Math.round((g_wallpaperImg.Width - src_w) / 2);
	}

	gr.DrawBitmap(g_wallpaperImg, 0, 0, ww, wh, src_x + 3, src_y + 3, src_w - 6, src_h - 6, ppt.wallpaperopacity);
}

function drawAlbumArt(gr, x, y, w, h) {
	if (g_wallpaperImg) {
		g_wallpaperImg.Dispose();
		g_wallpaperImg = null;
	}

	var metadb = fb.GetNowPlaying();
	if (!metadb)
		return;

	var img = metadb.GetAlbumArt();

	drawImage(gr, img, x, y, w, h, false, 1.0, false, 0.08);
}

function fillRectangle(gr, x, y, w, h, round, colour) {
	if (round) {
		gr.FillRoundedRectangle(x, y, w, h, scale(4), scale(4), colour);
	} else {
		gr.FillRectangle(x, y, w, h, colour);
	}
}

function drawRectangle(gr, x, y, w, h, round, colour) {
	if (round) {
		gr.DrawRoundedRectangle(x, y, w - 1, h - 1, scale(4), scale(4), 1, colour);
	} else {
		gr.DrawRectangle(x, y, w - 1, h - 1, 1, colour);
	}
}

function GetKeyboardMask() {
	switch (true) {
		case utils.IsKeyPressed(VK_CONTROL):
			return KMask.ctrl;
		case utils.IsKeyPressed(VK_SHIFT):
			return KMask.shift;
		case utils.IsKeyPressed(VK_ALT):
			return KMask.alt;
		default:
			return KMask.none;
	}
}

function button(normal, hover, down) {
	this.x = 0;
	this.y = 0;
	this.w = normal.Width;
	this.h = normal.Height;
	this.img = [normal, hover, down];
	this.state = ButtonStates.normal;

	this.update = function (normal, hover, down) {
		this.w = normal.Width;
		this.h = normal.Height;
		this.img = [normal, hover, down];
	}

	this.draw = function (gr, x, y, alpha) {
		this.x = x;
		this.y = y;
		if (this.img[this.state]) {
			gr.DrawImage(this.img[this.state], this.x, this.y, this.w, this.h, 0, 0, this.w, this.h);
		}
	}

	this.repaint = function () {
		window.RepaintRect(this.x, this.y, this.w, this.h);
	}

	this.checkstate = function (event, x, y) {
		var hover = x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.h;
		var old = this.state;

		switch (event) {
		case "lbtn_down":
			switch (this.state) {
			case ButtonStates.normal:
			case ButtonStates.hover:
				this.state = hover ? ButtonStates.down : ButtonStates.normal;
				this.isdown = true;
				break;
			}
			break;
		case "lbtn_up":
			this.state = hover ? ButtonStates.hover : ButtonStates.normal;
			this.isdown = false;
			break;
		case "move":
			switch (this.state) {
			case ButtonStates.normal:
			case ButtonStates.hover:
				this.state = hover ? ButtonStates.hover : ButtonStates.normal;
				break;
			}
			break;
		case "leave":
			this.state = this.isdown ? ButtonStates.down : ButtonStates.normal;
			break;
		}

		if (this.state != old)
			this.repaint();

		return this.state;
	}
}

function setWallpaperImg() {
	if (g_wallpaperImg) {
		g_wallpaperImg.Dispose();
		g_wallpaperImg = null;
	}

	if (ppt.wallpapermode == 0)
		return;

	var metadb = fb.GetNowPlaying();
	if (!metadb)
		return;

	var img = null;

	if (ppt.wallpapermode == 1) {
		img = metadb.GetAlbumArt();
	} else if (ppt.wallpapermode == 2) {
		if (utils.IsFile(ppt.wallpaperpath)) {
			img = utils.LoadImage(ppt.wallpaperpath);
		} else {
			img = utils.LoadImage(fb.ProfilePath + ppt.wallpaperpath);
		}
	}

	if (img) {
		if (ppt.wallpaperblurred) {
			img.StackBlur(ppt.wallpaperblur);
		}

		g_wallpaperImg = img.CreateBitmap();
		img.Dispose();
	}
}

function scale(size) {
	return Math.round(size * window.DPI / 72);
}

function height(font) {
	return Math.round(JSON.parse(font).Size * 1.2);
}

function smooth_font(name, size, weight, style) {
	return JSON.stringify({
		Name : name,
		Size : scale(size),
		Weight : typeof weight == "number" ? weight : DWRITE_FONT_WEIGHT_MEDIUM,
		Style : typeof style == "number" ? style : 0
	});
}

function get_font() {
	var default_font;

	default_font = JSON.parse(window.IsDefaultUI ? window.GetFontDUI(FontTypeDUI.playlists) : window.GetFontCUI(FontTypeCUI.items));

	var name = default_font.Name;
	var size = ppt.fontSize;

	g_font = smooth_font(name, size);
	g_font_bold = smooth_font(name, size, DWRITE_FONT_WEIGHT_BOLD);
	g_font_group1 = smooth_font(name, size + 6, DWRITE_FONT_WEIGHT_BOLD);
	g_font_group2 = smooth_font(name, size + 2, DWRITE_FONT_WEIGHT_BOLD);
	g_font_material = smooth_font("Material Icons", size + 2);

	g_rating_width = chars.heart_on.calc_width2(g_font_material);

	g_font_height = height(g_font);
	g_font_bold_height = height(g_font_bold);
	g_font_group1_height = height(g_font_group1);
	g_font_group2_height = height(g_font_group2);
	g_font_material_height = height(g_font_material);

	M = g_font_height;

	get_images();
}

function darken_colour(colour, percent) {
	var shift = Math.max(colour * percent / 100, percent / 2);
	var val = Math.round(colour - shift);
	return Math.max(val, 0);
}

function lighten_colour(colour, percent) {
	var val = Math.round(colour + ((255 - colour) * (percent / 100)));
	return Math.min(val, 255);
}

function shade_colour(colour, percent) {
	var r = getRed(colour);
	var g = getGreen(colour);
	var b = getBlue(colour);
	return RGBA(darken_colour(r, percent), darken_colour(g, percent), darken_colour(b, percent), getAlpha(colour));
}

function tint_colour(colour, percent) {
	var r = getRed(colour);
	var g = getGreen(colour);
	var b = getBlue(colour);
	return RGBA(lighten_colour(r, percent), lighten_colour(g, percent), lighten_colour(b, percent), getAlpha(colour));
}

function is_grayscale(colour) {
	return getRed(colour) == getGreen(colour) && getGreen(colour) == getBlue(colour);
}

function is_close_to_grayscale(colour) {
	var threshold = 6;
	var r = getRed(colour);
	var g = getGreen(colour);
	var b = getBlue(colour);
	var avg = Math.round((r + g + b) / 3);

	return is_grayscale(colour) ||
		(Math.abs(getRed(colour) - avg) < threshold &&
		Math.abs(getGreen(colour) - avg) < threshold &&
		Math.abs(getBlue(colour) - avg) < threshold);
}

function get_colours() {
	if (ppt.enableDynamicColours) {
		var arr = GetNowPlayingColours();
		if (arr.length) {
			g_colour_background = arr[0];
			g_colour_text = arr[1];
			g_colour_selection = arr[2];
			g_colour_selected_text = arr[3];
			g_colour_highlight = g_colour_text;
			g_themed = false;
			get_images();
			return;
		} else {
			g_colour_background = 0xff000000;
			g_colour_text = 0xffffffff;
			g_colour_selection = 0xffb6b6b6;
			g_colour_selection_text = g_colour_text;
			g_colour_highlight = g_colour_text;
		}
	}

	if (ppt.enableCustomColours) {
		g_colour_background = window.GetProperty("SMOOTH.COLOUR.BACKGROUND.NORMAL", RGB(0, 0, 0));
		g_colour_text = window.GetProperty("SMOOTH.COLOUR.TEXT", RGB(255, 255, 255));
		g_colour_selection = window.GetProperty("SMOOTH.COLOUR.BACKGROUND.SELECTED", RGB(0, 102, 204));
		g_colour_selected_text = DetermineTextColour(g_colour_selection);
		g_colour_highlight = g_colour_text;
		g_themed = false;
	} else {
		if (window.IsDefaultUI) {
			g_colour_background = window.GetColourDUI(ColourTypeDUI.background);
			g_colour_text = /*window.GetColourDUI(ColourTypeDUI.text);*/DetermineTextColour(g_colour_background);
			g_colour_selection = window.GetColourDUI(ColourTypeDUI.selection);
			g_colour_highlight = window.GetColourDUI(ColourTypeDUI.highlight);
		} else {
			g_colour_background = window.GetColourCUI(ColourTypeCUI.background);
			g_colour_text = /*window.GetColourCUI(ColourTypeCUI.text);*/DetermineTextColour(g_colour_background);
			g_colour_selection = window.GetColourCUI(ColourTypeCUI.inactive_selection_text);
			g_colour_highlight = window.GetColourCUI(ColourTypeCUI.inactive_selection_text);
		}
		g_colour_selected_text = DetermineTextColour(g_colour_selection);
	}

	g_colour_splitter = !window.IsDark ? 0xfff0f0f0 : window.IsDefaultUI ? 0xff424242 : 0xff333333;
	get_images();
}

function process_string(str) {
	var str_ = [];
	str = str.toLowerCase();
	while (str != (temp = str.replace("  ", " ")))
		str = temp;
	str = str.split(" ").sort();
	for (var i in str) {
		if (str[i] != "") {
			str_[str_.length] = str[i];
		}
	}
	return str_;
}

function match(input, str) {
	input = input.toLowerCase();
	for (var j in str) {
		if (input.indexOf(str[j]) < 0)
			return false;
	}
	return true;
}

var ButtonStates = {
	normal: 0,
	hover: 1,
	down: 2
};

var KMask = {
	none: 0,
	ctrl: 1,
	shift: 2,
	alt: 4,
};

var images = {
	cache : {},
	dominantColours : {},
	clear : function () {
		for (var i in this.cache) {
			this.cache[i].Dispose();
		}
		this.cache = {};
		this.dominantColours = {};
	}
}

var ppt = {
	enableDynamicColours : window.GetProperty("SMOOTH.DYNAMIC.COLOURS.ENABLED", false),
	enableCustomColours: window.GetProperty("SMOOTH.CUSTOM.COLOURS.ENABLED", false),
	wallpapermode: window.GetProperty("SMOOTH.WALLPAPER.MODE", 0), // 0 none, 1 front cover 2 custom image
	wallpaperblurred: window.GetProperty("SMOOTH.WALLPAPER.BLURRED", false),
	wallpaperblur: window.GetProperty("SMOOTH.WALLPAPER.BLUR", 150),
	wallpaperpath: window.GetProperty("SMOOTH.WALLPAPER.PATH", ""),
	wallpaperopacity: window.GetProperty("SMOOTH.WALLPAPER.OPACITY", 0.2),
	fontSize: window.GetProperty("SMOOTH.FONT.SIZE", 10),
	fontSizes: [10, 11, 12, 13],
	refreshRate: 25,
	rowHeight: 0,
	rowScrollStep: 3,
	scrollSmoothness: 2.5,
};

var CACHE_FOLDER = fb.ProfilePath + "cache\\";
utils.CreateFolder(CACHE_FOLDER);

chars.add_folder = "\ue2cc";
chars.edit_query = "\ue3c9";
chars.close = "\ue14c";
chars.search = "\ue8b6";
chars.dark = "\ue51c";
chars.light = "\ue518";
chars.check = "\ue834";
chars.arrow_left = "\ue5cb";
chars.arrow_right = "\ue5cc";
chars.arrow_up = "\ue5ce";
chars.arrow_down = "\ue5cf";
chars.pause = "\ue034";
chars.play = "\ue037";
chars.next = "\ue044";
chars.prev = "\ue045";
chars.stop = "\ue047";
chars.heart_on = "\ue87d";
chars.heart_off = "\ue87e";
chars.heart_broken = "\ueac2";
chars.repeat_all = "\ue040";
chars.repeat_one = "\ue041";
chars.shuffle = "\ue043";
chars.volume0 = "\ue04d";
chars.volume1 = "\ue050";
chars.volume2 = "\ue04f";

var g_font;
var g_font_bold;
var g_font_group1;
var g_font_group2;
var g_font_material;

var g_colour_text = 0;
var g_colour_selected_text = 0;
var g_colour_background = 0;
var g_colour_selection = 0;
var g_colour_highlight = 0;
var g_colour_splitter = 0;

var g_rating_width = 0;

var g_active_playlist = plman.ActivePlaylist;
var g_wallpaperImg = null;
var isScrolling = false;
var need_repaint = false;
var g_start_ = 0, g_end_ = 0;
var m_x = 0, m_y = 0;
var scroll_ = 0, scroll = 0, scroll_prev = 0;
var ww = 0, wh = 0;

get_font();
get_colours();
