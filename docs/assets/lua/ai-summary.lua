-- /assets/lua/ai-summary.lua
function Pandoc(doc)
  if doc.meta["ai-summary"] then
    local meta = doc.meta["ai-summary"]

    -- Extract values, with sensible defaults if a key is missing
    local bannerTitle = pandoc.utils.stringify(meta["banner-title"] or "Yapper Labs | AI Summary")
    local modelTitle  = pandoc.utils.stringify(meta["model-title"] or "Model: o3-mini-high")
    local modelImg    = pandoc.utils.stringify(meta["model-img"] or "/assets/images/OpenAI-white-monoblossom.svg")
    local summaryText = pandoc.utils.stringify(meta["summary"] or "")

    -- Define basic CSS for the banner
    local style = [[
<style>
.AI-Summary {
  margin: 20px auto;
  padding: 40px;
  background-color: #fff;
  box-shadow: rgba(6, 24, 44, 0.4) 0px 0px 0px 2px, 
              rgba(6, 24, 44, 0.65) 0px 4px 6px -1px, 
              rgba(255, 255, 255, 0.08) 0px 1px 0px inset;
  border-radius: 15px;
  max-width: 100%;
  font-size: 1.2em;
  line-height: 1.5;
  font-family: "Open Sans", sans-serif;
}
.mini-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 15px;
  background: linear-gradient(90deg, #2d2d2d, #1a1a1a);
  color: #ffffff;
  border-radius: 15px;
  box-shadow: rgba(0, 0, 0, 0.4) 0px 2px 4px, 
              rgba(0, 0, 0, 0.3) 0px 7px 13px -3px, 
              rgba(0, 0, 0, 0.2) 0px -3px 0px inset;
}
.mini-banner .openai-logo {
  width: 35px;
  height: 35px;
  margin-right: 1px;
}
.AI-Summary p {
  margin: 0;
  padding: 10px;
  font-size: 1em;
  line-height: 1.5;
}
</style>
]]

    -- Build the banner HTML using the metadata values and wrap the summary in <p> tags
    local banner_html = [[
<div class="AI-Summary" markdown="1">
  <div class="mini-banner">
    <span class="left-banner">]] .. bannerTitle .. [[</span>
    <span class="right-banner">
      <img src="]] .. modelImg .. [[" alt="Model Logo" class="openai-logo">
      ]] .. modelTitle .. [[
    </span>
  </div>
  <p>]] .. summaryText .. [[</p>
</div>
]]

    -- Combine the style and the banner HTML
    local full_html = style .. "\n" .. banner_html

    -- Create a RawBlock for the full HTML and insert it at the top of the document
    local banner_block = pandoc.RawBlock("html", full_html)
    table.insert(doc.blocks, 1, banner_block)
  end
  return doc
end
