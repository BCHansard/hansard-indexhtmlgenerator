@echo off

call .\node_modules\.bin\babel index.jsx --out-file index.js
call .\node_modules\.bin\lessc index.less index.css

echo Done