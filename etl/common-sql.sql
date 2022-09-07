

/*SQL to restart a sequence*/
alter sequence sneaker_brands_id_seq restart with 1

/*finding the most recent brand_name entries */

select brand_name from sneaker_brands_import where sneaker_brands_import.id = (select MAX(id) from sneaker_brands_import group by id, brand_name
order by id);


/* adding a text column to a postgreSql table */
alter table sneakers add column thumbnail_image varchar(255) not null;

/* droping a table constraint e.g. foreign key or unique index*/
alter table sneakers drop constraint sneakers_brand_id_key*/

/* chaing the size of a text column */

alter table sneakers alter column sneaker_name type varchar(100)

/* moving price data */
insert into reseller_sneaker_prices_import (sneaker_id, reseller_id, price)
select distinct sneakers_import.id as sneakerid, resellers_import.id as resellerid, sneakers_import.goat_product_id, sneakers_import.sneaker_name from sneakers_import, resellers_import 
where sneakers_import.id in (select MAX(id) from sneakers_import group by goat_product_id)
and resellers_import.id in (select MAX(id) from resellers_import group by reseller_name)
order by sneakers_import.id asc*/

/* dropping a table in postgreSql */
drop table sneaker_prices_import;

/* creaiting a postgreSql table */
CREATE TABLE sneaker_prices_import (
    sneaker_name varchar(100),       
    reseller_name varchar(100),
    url varchar,
    price decimal

);

/*change the size of a archer column */
alter table sneakers alter column sneaker_name type character varying(255);


/* moving reseller data from resellers_import to resellers */
insert into resellers (reseller_name, reseller_url, created_at, updated_at) select resellers_import.reseller_name,
resellers_import.reseller_url, LOCALTIMESTAMP, LOCALTIMESTAMP from resellers_import;


/* moving brand data from sneaker_brands_import to sneaker_brands */
insert into sneaker_brands (brand_name, created_at, updated_at) select sneaker_brands_import.brand_name, LOCALTIMESTAMP as created_at, LOCALTIMESTAMP as updated_at
from sneaker_brands_import where sneaker_brands_import.id in (select MAX(sneaker_brands_import.id) from sneaker_brands_import group by brand_name);


/* moving sneakers import data in sneakers */
insert into sneakers (image_link_url, goat_product_id, release_date, style_id, sneaker_name, colorway, thumbnail_image, brand_id, description, created_at, updated_at)
select image_link_url, goat_product_id, release_date,style_id, sneaker_name, colorway, thumbnail_image, sneaker_brands.id, description, LOCALTIMESTAMP, LOCALTIMESTAMP from 
sneakers_import, sneaker_brands
where sneakers_import.brand = sneaker_brands.brand_name
and sneakers_import.id in
(select MAX(id) from sneakers_import group by goat_product_id);

drop table sneaker_prices_import;

CREATE TABLE sneaker_prices_import (
    id serial primary key,
    sneaker_name varchar(100),       
    reseller_name varchar(100),
    url varchar,
    price decimal,
    created_at timestamp,
    updated_at timestamp

);

/* moving sneaker prices import data to sneaker prices */
/* need to modify to get the lastest sneaker prices data  from the import tables*/

insert into sneaker_prices(price, reseller_id, sneaker_id, url, created_at, updated_at)
select price, resellers.id as reseller_id, sneakers.id as sneaker_id, url, LOCALTIMESTAMP, LOCALTIMESTAMP from sneaker_prices_import, sneakers, resellers where
sneaker_prices_import.sneaker_name = sneakers.sneaker_name
and sneaker_prices_import.reseller_name = resellers.reseller_name;

SELECT PRICE, SNEAKER_NAME, THUMBNAIL_IMAGE, RESELLER_NAME FROM sneakers, sneaker_prices, resellers WHERE sneakers.id  = sneaker_prices.sneaker_id AND sneaker_prices.reseller_id  = resellers.id LIMIT 10
