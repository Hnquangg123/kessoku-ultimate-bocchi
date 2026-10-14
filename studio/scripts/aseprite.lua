-- Aseprite's half of scripts/aseprite.mjs (run it through that, not by hand).
-- Reads the manifest the node script writes (sprites: their frames as 1x PNGs
-- with milliseconds, their tags, palette, and where the exports go) and either
--
--   mode=build    makes each .aseprite: one rgb layer named for the member,
--                 a frame per PNG with its duration, one forward tag per mood,
--                 the palette set to the colors the frames use
--   mode=verify   opens every .aseprite, sheet (PNG + JSON) and GIF again and
--                 checks each frame's pixels, durations and tags against the PNGs
--
--   aseprite -b --script-param manifest=<file.json> --script-param mode=build --script scripts/aseprite.lua

local function readAll(file)
  local f = assert(io.open(file, "rb"), "cannot open " .. file)
  local text = f:read("a")
  f:close()
  return text
end

local manifest = json.decode(readAll(assert(app.params.manifest, "no manifest param")))
local mode = app.params.mode or "build"
local pc = app.pixelColor
local function int(n) return string.format("%d", math.floor(n + 0.5)) end

local function hexColor(hex)
  return Color{ r = tonumber(hex:sub(2, 3), 16), g = tonumber(hex:sub(4, 5), 16), b = tonumber(hex:sub(6, 7), 16), a = 255 }
end

-- The timeline colors of the mood tags (the stage colors of the mod's moods).
local TAG_COLORS = {
  anxious = "#7d6bb0",
  focused = "#3f7fbf",
  happy = "#e8a33a",
  panic = "#d9534f",
  melting = "#5fb3a1",
  hiding = "#8a8a8a",
}

local function build(s)
  local sprite = Sprite(s.width, s.height, ColorMode.RGB)
  local layer = sprite.layers[1]
  layer.name = s.layer
  for i, f in ipairs(s.frames) do
    if i > 1 then sprite:newEmptyFrame(i) end
    local image = Image{ fromFile = f.file }
    if image.width ~= s.width or image.height ~= s.height then
      error(f.file .. " is " .. image.width .. "x" .. image.height .. ", not " .. s.width .. "x" .. s.height)
    end
    sprite:newCel(layer, i, image, Point(0, 0))
    sprite.frames[i].duration = f.ms / 1000
  end
  if #s.palette <= 255 then
    local palette = Palette(#s.palette + 1)
    palette:setColor(0, Color{ r = 0, g = 0, b = 0, a = 0 })
    for i, hex in ipairs(s.palette) do palette:setColor(i, hexColor(hex)) end
    sprite:setPalette(palette)
  else
    print("warning: " .. s.name .. " uses " .. #s.palette .. " colors; the palette is left as it was")
  end
  for _, t in ipairs(s.tags) do
    local tag = sprite:newTag(t.from, t.to)
    tag.name = t.name
    tag.aniDir = AniDir.FORWARD
    if TAG_COLORS[t.name] then tag.color = hexColor(TAG_COLORS[t.name]) end
  end
  sprite:saveAs(s.out)
  sprite:close()
  print("built " .. s.out .. " (" .. #s.frames .. " frames, " .. #s.tags .. " tags)")
end

-- Pixels of `a` at (ax, ay) against the whole of `b`; fully transparent pixels
-- match whatever their rgb. Returns nil when equal, else "x,y".
local function differs(a, ax, ay, b)
  for y = 0, b.height - 1 do
    for x = 0, b.width - 1 do
      local p = a:getPixel(ax + x, ay + y)
      local q = b:getPixel(x, y)
      if p ~= q and not (pc.rgbaA(p) == 0 and pc.rgbaA(q) == 0) then return x .. "," .. y end
    end
  end
  return nil
end

local function rendered(sprite, frame)
  local image = Image(ImageSpec{ width = sprite.width, height = sprite.height, colorMode = ColorMode.RGB })
  image:clear()
  image:drawSprite(sprite, frame)
  return image
end

local failures = 0
local function fail(message)
  failures = failures + 1
  print("FAIL " .. message)
end

-- An opened sprite (the .aseprite or a GIF) against frames `from`..`to` of s.
local function checkSprite(label, sprite, s, from, to)
  local n = to - from + 1
  if #sprite.frames ~= n then return fail(label .. ": " .. #sprite.frames .. " frames, want " .. n) end
  if sprite.width ~= s.width or sprite.height ~= s.height then return fail(label .. ": " .. sprite.width .. "x" .. sprite.height) end
  for i = 1, n do
    local want = s.frames[from + i - 1]
    local ms = math.floor(sprite.frames[i].duration * 1000 + 0.5)
    if ms ~= want.ms then fail(label .. " frame " .. i .. ": " .. ms .. " ms, want " .. int(want.ms)) end
    local at = differs(rendered(sprite, i), 0, 0, Image{ fromFile = want.file })
    if at then fail(label .. " frame " .. i .. ": pixel " .. at .. " differs from " .. want.file) end
  end
  return n
end

local function verify(s)
  local before = failures
  local sprite = app.open(s.out)
  if not sprite then return fail(s.out .. ": does not open") end
  if sprite.colorMode ~= ColorMode.RGB then fail(s.out .. ": not rgb") end
  checkSprite(s.out, sprite, s, 1, #s.frames)
  if #sprite.tags ~= #s.tags then fail(s.out .. ": " .. #sprite.tags .. " tags, want " .. #s.tags) end
  for i, t in ipairs(s.tags) do
    local tag = sprite.tags[i]
    if not tag or tag.name ~= t.name or tag.fromFrame.frameNumber ~= t.from or tag.toFrame.frameNumber ~= t.to or tag.aniDir ~= AniDir.FORWARD then
      fail(s.out .. ": tag " .. i .. " is not " .. t.name .. " " .. t.from .. "-" .. t.to .. " forward")
    end
  end
  local tagCount = #sprite.tags
  sprite:close()

  -- The sheet: every frame's rectangle and duration, the tags listed.
  local data = json.decode(readAll(s.sheet.json))
  local sheet = Image{ fromFile = s.sheet.png }
  if #data.frames ~= #s.frames then
    fail(s.sheet.json .. ": " .. #data.frames .. " frames, want " .. #s.frames)
  else
    for i, entry in ipairs(data.frames) do
      local want = s.frames[i]
      local r = entry.frame
      if r.w ~= s.width or r.h ~= s.height then fail(s.sheet.json .. " frame " .. i .. ": " .. int(r.w) .. "x" .. int(r.h)) end
      if entry.duration ~= want.ms then fail(s.sheet.json .. " frame " .. i .. ": " .. int(entry.duration) .. " ms, want " .. int(want.ms)) end
      local at = differs(sheet, r.x, r.y, Image{ fromFile = want.file })
      if at then fail(s.sheet.png .. " frame " .. i .. " at " .. int(r.x) .. "," .. int(r.y) .. ": pixel " .. at .. " differs") end
    end
  end
  local listed = data.meta.frameTags or {}
  if #listed ~= #s.tags then fail(s.sheet.json .. ": " .. #listed .. " tags listed, want " .. #s.tags) end

  -- One GIF per mood.
  for i, g in ipairs(s.gifs) do
    local t = s.tags[i]
    local gif = app.open(g.file)
    if not gif then
      fail(g.file .. ": does not open")
    else
      checkSprite(g.file, gif, s, t.from, t.to)
      gif:close()
    end
  end
  if failures > before then return end
  print("verified " .. s.out .. " (" .. #s.frames .. " frames, " .. tagCount .. " tags), " .. s.sheet.png .. " (" .. sheet.width .. "x" .. sheet.height .. "), " .. #s.gifs .. " GIFs")
end

for _, s in ipairs(manifest.sprites) do
  if mode == "build" then build(s) elseif mode == "verify" then verify(s) else error("unknown mode " .. mode) end
end
if failures > 0 then error(failures .. " check(s) failed") end
