const AD_HTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;overflow:hidden;background:transparent}</style></head><body>
<script type="text/javascript">
  atOptions = {
    'key' : '442cefa35277d621e3b7fcb2758e9f07',
    'format' : 'iframe',
    'height' : 250,
    'width' : 300,
    'params' : {}
  };
</script>
<script type="text/javascript" src="https://www.highperformanceformat.com/442cefa35277d621e3b7fcb2758e9f07/invoke.js"></script>
</body></html>`;

export function SponsoredSlot({ id }: { id: string }) {
  return (
    <div className="glass rounded-2xl p-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/70">
        Sponsored Content
      </p>
      <div className="flex justify-center">
        <iframe
          id={`adsterra-${id}`}
          title={`Sponsored content ${id}`}
          srcDoc={AD_HTML}
          width={300}
          height={250}
          scrolling="no"
          loading="lazy"
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin"
          className="border-0"
        />
      </div>
    </div>
  );
}
