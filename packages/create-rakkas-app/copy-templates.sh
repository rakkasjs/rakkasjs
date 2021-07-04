rm -rf templates
for SRC in $(git ls-files ../../templates)
do
	DEST=./templates/$(echo $SRC | cut -c 16-)
	mkdir -p $(dirname $DEST)
	cp $SRC $DEST
done
