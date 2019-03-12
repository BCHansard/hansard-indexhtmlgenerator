# Indexing Output Generation

This program takes [Cindex](https://www.indexres.com/cindex) xml output and creates a searchable html document powered by javascript functionality.

Sample xml files are located in testing/index_examples and page maps are located in testing/page_map_examples

## Prerequisites
*Node, Python*

## Installing
```bash
# install node packages
npm i

# install python packages
pip install -r requirements.txt
```

## Building
```bash
# build js and css files
# run from git bash
./build.bat
```

## Running
```bash
# eg. python parse.py testing/index_examples/2017SUBJECT-Sample.xml
python parse.py {cindex xml file}
```

## Results
Results are generated into the output folder as a.js , a.json and a.out

View the results in output/test.html