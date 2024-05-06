export const Clip = ({ value, tr, tl, br, bl, outline, aspect, style, animate, children }) => {
  return (
    <div
      className={`
				clip
				${animate && 'animate'}
				${style}
				${outline && 'bg-gradient-to-r from-violet to-seagull'}
			`}
      style={{
        clipPath: `polygon(${tl ? value : 0}${aspect ? '%' : 'px'} 0%, calc(100% - ${tr ? value : 0}${
          aspect ? '%' : 'px'
        }) 0%, 100% calc(${value}${aspect ? '%' : 'px'}/${aspect ? aspect : 2}), 100% calc(100% - ${br ? value : 0}${
          aspect ? '%' : 'px'
        }/${aspect ? aspect : 2}), calc(100% - ${value}${aspect ? '%' : 'px'}) 100%, calc(${bl ? value : 0}${
          aspect ? '%' : 'px'
        }) 100%, 0% calc(100% - ${value}${aspect ? '%' : 'px'}/${aspect ? aspect : 2}), 0% calc(${value}${
          aspect ? '%' : 'px'
        }/${aspect ? aspect : 2}))`,
      }}>
      {outline ? (
        <div
          className={`${style} relative z-[1] bg-default !h-full !p-0`}
          style={{
            clipPath: `polygon(${tl ? value - (aspect ? 0.01 : 1) : 0}${aspect ? '%' : 'px'} 0%, calc(100% - ${
              tr ? value - (aspect ? 0.01 : 1) : 0
            }${aspect ? '%' : 'px'}) 0%, 100% calc(${value - (aspect ? 0.01 : 1)}${aspect ? '%' : 'px'}/${
              aspect ? aspect : 2
            }), 100% calc(100% - ${br ? value - (aspect ? 0.01 : 1) : 0}${aspect ? '%' : 'px'}/${
              aspect ? aspect : 2
            }), calc(100% - ${value - (aspect ? 0.01 : 1)}${aspect ? '%' : 'px'}) 100%, calc(${
              bl ? value - (aspect ? 0.01 : 1) : 0
            }${aspect ? '%' : 'px'}) 100%, 0% calc(100% - ${value - (aspect ? 0.01 : 1)}${aspect ? '%' : 'px'}/${
              aspect ? aspect : 2
            }), 0% calc(${value - (aspect ? 0.01 : 1)}${aspect ? '%' : 'px'}/${aspect ? aspect : 2}))`,
          }}>
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
};
