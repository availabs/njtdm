GENERATED_FILES = \
	counties36.json

all: $(GENERATED_FILES)

.PHONY: clean all

clean:
	rm -rf -- $(GENERATED_FILES) build

build/tl_2013_us_county.zip:
	mkdir build
	curl -o $@ 'http://www2.census.gov/geo/tiger/TIGER2013/COUNTY/$(notdir $@)'

build/tracts-unfiltered.shp: build/tl_2013_us_county.zip
	rm -rf -- $(basename $@)
	mkdir -p $(basename $@)
	unzip -d $(basename $@) $<
	for file in $(basename $@)/*; do chmod 644 $$file; mv $$file $(basename $@).$${file##*.}; done
	rmdir $(basename $@)
	touch $@

# strip water tracts
build/tracts.shp: build/tracts-unfiltered.shp
	rm -f -- $@
	ogr2ogr -f 'ESRI Shapefile' -where 'STATEFP = "36"' $@ $<

counties36.json: build/tracts.shp
		topojson \
		-o $@ \
		-p geoid=+GEOID,name=+=NAMELSAD,area=+ALAND \
		-- $(filter %.shp,$^)