@echo off

call .\node_modules\.bin\babel index.jsx --out-file output\index.js
call .\node_modules\.bin\lessc index.less output\index.css

echo Done