export const getHtml = (params: {
  width: number;
  height: number;
  events: any[];
  sketch: any;
  timestamp: number;
}) => {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      body {
        margin: 0;
        display: flex;
        min-height: 100vh;
      }
      #replayer { width: ${params.width}px; height: ${params.height}px; position: relative; }
      #sketch { position: absolute; z-index: 11; }


      .replayer-wrapper {
        position: relative;
      }

      .replayer-wrapper iframe {
        position: relative;
        z-index: 0;
      }

      .replayer-mouse,
      .replayer-mouse-tail {
        position: absolute;
        top: 0;
        left: 0;
        z-index: 10; /* higher than iframe */
        pointer-events: none; /* ensure they don't block clicks */
      }
    </style>
  </head>
  <body>
  <div id="container">
    <div id="replayer"></div>
    <div id="sketch"></div>
   </div>
    <script type="module">
      import { Replayer } from 'https://cdn.jsdelivr.net/npm/rrweb@2.0.0-alpha.20/dist/rrweb.min.js'
      import { exportToSvg } from 'https://cdn.jsdelivr.net/npm/@excalidraw/excalidraw@0.18.0/+esm'
      (async () => {
        try {
          // Wait for fonts to load
          await document.fonts.ready;
          const events = ${JSON.stringify(params.events)};
          const replayer = new Replayer(events, {
            root: document.getElementById("replayer"),
            skipInactive: true,
            pauseAnimation: false,
            mouseTail: true,
            showDebug: false,
            showWarning: false,
            useVirtualDom: true,
            UNSAFE_replayCanvas: false,
          });

          if (${!!params.sketch}) {
            const sketchDiv = document.getElementById("sketch");
            const sketch = ${JSON.stringify(params.sketch)}
            const offset = 10
            const svg = await exportToSvg({...sketch, exportPadding: offset});
            
            // Calculate bounds for each element, handling freedraw elements specially
            const bounds = sketch.elements.map(el => {
              if (el.type === 'freedraw' && el.points) {
                // For freedraw, calculate bounds from points array
                const xCoords = el.points.map(p => el.x + p[0]);
                const yCoords = el.points.map(p => el.y + p[1]);
                return {
                  minX: Math.min(...xCoords),
                  minY: Math.min(...yCoords),
                  maxX: Math.max(...xCoords),
                  maxY: Math.max(...yCoords)
                };
              } else {
                // For other elements, use x, y, width, height
                return {
                  minX: el.x,
                  minY: el.y,
                  maxX: el.x + el.width,
                  maxY: el.y + el.height
                };
              }
            });
            
            const minX = Math.min(...bounds.map(b => b.minX));
            const minY = Math.min(...bounds.map(b => b.minY));
            const maxX = Math.max(...bounds.map(b => b.maxX));
            const maxY = Math.max(...bounds.map(b => b.maxY));

            const svgWidth = maxX - minX;
            const svgHeight = maxY - minY;

            svg.setAttribute('width', svgWidth + offset*2);
            svg.setAttribute('height', svgHeight + offset*2);
            svg.setAttribute('viewBox', \`0 0 \${svgWidth + offset*2} \${svgHeight + offset*2}\`);
            const bgRect = svg.querySelector('rect');
            if (bgRect) bgRect.remove();
            sketchDiv.appendChild(svg);

            const replayer = document.getElementById("replayer");
            const replayerWidth = ${params.width};
            const replayerHeight = ${params.height};

            // Calculate positions based on size comparison
            let svgLeft = 0;
            let svgTop = 0;
            let replayerLeft = 0;
            let replayerTop = 0;

            if (svgWidth < replayerWidth) {
              svgLeft = minX - offset;
            } else {
              replayerLeft = -minX + offset;
            }

            if(svgHeight < replayerHeight) {
              svgTop = minY - offset;
            } else {
              replayerTop = -minY + offset;
            }

            // Calculate body dimensions accounting for positions
            const svgRight = svgLeft + svgWidth;
            const svgBottom = svgTop + svgHeight;
            const replayerRight = replayerLeft + replayerWidth;
            const replayerBottom = replayerTop + replayerHeight;

            // Find the minimum position (might be negative) and shift everything to make it 0
            const minLeft = Math.min(svgLeft, replayerLeft);
            const minTop = Math.min(svgTop, replayerTop);

            // Shift positions so nothing is negative
            const shiftX = minLeft < 0 ? -minLeft : 0;
            const shiftY = minTop < 0 ? -minTop : 0;

            svgLeft += shiftX;
            svgTop += shiftY;
            replayerLeft += shiftX;
            replayerTop += shiftY;

            // Apply the final positions
            sketchDiv.style.left = \`\${svgLeft}px\`;
            sketchDiv.style.top = \`\${svgTop}px\`;
            replayer.style.left = \`\${replayerLeft}px\`;
            replayer.style.top = \`\${replayerTop}px\`;

            const bodyWidth = Math.max(svgRight, replayerRight) - Math.min(minLeft, 0);
            const bodyHeight = Math.max(svgBottom, replayerBottom) - Math.min(minTop, 0);

            document.body.style.width = \`\${bodyWidth}px\`;
            document.body.style.height = \`\${bodyHeight}px\`;
            document.body.style.minHeight = \`\${bodyHeight}px\`;
          }
          replayer.pause()
          setTimeout(async () => {
            replayer.pause(${params.timestamp});
            const iframe = document.querySelector('.replayer-wrapper iframe');
            if (iframe?.contentDocument) {
              const style = iframe.contentDocument.createElement('style');
              style.textContent = \`
                * {
                  animation-duration: 0s !important;
                  transition-duration: 0s !important;
                  animation-delay: 0s !important;
                  transition-delay: 0s !important;
                }
              \`;
              iframe.contentDocument.head.appendChild(style);

              // Wait for fonts to load within the iframe
              await iframe.contentDocument.fonts.ready;
            }
            window.pageReady = true;
            document.body.classList.add('ready');
          }, 20);

        } catch (error) {
          window.pageReady = true;
          document.body.classList.add('ready');
          console.error('Error loading page:', error);
        }
      })();
    </script>
  </body>
</html>
`
}
