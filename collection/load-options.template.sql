-- Loads one model's options file. Written by load-options.py; do not edit the copies, edit this template.
do $do$
declare
  raw text := $raw${{RAW}}$raw$;
  notes jsonb := {{NOTES}}::jsonb;
  lines text[]; hd text[]; f text[]; per text[]; l text; v text;
  v_brand bigint; v_model bigint; v_id bigint; trim_ids bigint[] := '{}'; opt_ids bigint[] := '{}';
  i int; k int := 0;
begin
  if md5(raw) <> '{{MD5}}' then raise exception 'Fingerprint mismatch: the text is not the file that was collected'; end if;
  lines := string_to_array(raw, E'\n'); hd := string_to_array(substr(lines[1], 2), '|');
  insert into brands (name, slug, country, website_url) values ({{BRAND}}, {{BRAND_SLUG}}, {{COUNTRY}}, {{WEBSITE}})
    on conflict (slug) do update set website_url = excluded.website_url returning id into v_brand;
  delete from models where brand_id = v_brand and slug = hd[4] and model_year = hd[3]::int;   -- loading again replaces the model
  insert into models (brand_id, name, slug, model_year, generation, assembly_plant, basic_warranty, powertrain_warranty, roadside_assistance)
    values (v_brand, hd[2], hd[4], hd[3]::int, {{GENERATION}}, {{PLANT}}, {{BASIC}}, {{POWERTRAIN}}, {{ROADSIDE}}) returning id into v_model;
  foreach l in array lines[2:] loop
    f := string_to_array(l, ';');
    if f[1] = 'T' then
      insert into trims (model_id, name, slug, msrp_usd, build_url, build_url_level, destination_usd)
        values (v_model, f[2], trim(both '-' from lower(regexp_replace(f[2], '[^a-zA-Z0-9]+', '-', 'g'))), f[3]::numeric, {{PAGE}}, 'model', split_part(hd[5], ',', 1)::numeric)
        returning id into v_id;
      trim_ids := trim_ids || v_id;
    elsif f[1] = 'C' then
      insert into paints (model_id, name, manufacturer_code, price_usd) values (v_model, f[2], nullif(f[3], ''), f[4]::numeric) returning id into v_id;
      per := string_to_array(f[5], ',');
      for i in 1 .. array_length(trim_ids, 1) loop
        if per[i] <> '0' then
          insert into trim_paints (trim_id, paint_id, interior_colors) values (trim_ids[i], v_id, case when per[i] = 'Yes' then '{}'::text[] else string_to_array(per[i], '/') end);
        end if;
      end loop;
    elsif f[1] in ('P', 'W', 'E', 'I', 'L', 'F') then
      insert into options (model_id, category, name, price_usd, install_hours, manufacturer_code, parts_note, source_url)
        values (v_model, case f[1] when 'P' then 'package' when 'W' then 'wheels' when 'E' then 'exterior' when 'I' then 'interior' when 'L' then 'electronic' else 'factory' end,
                f[2], f[3]::numeric, nullif(f[4], '')::numeric, nullif(f[9], ''), notes ->> f[9], {{PAGE}})
        returning id into v_id;
      opt_ids := opt_ids || v_id;
      for i in 1 .. array_length(trim_ids, 1) loop
        if (f[5]::bigint >> (i - 1)) & 1 = 1 then insert into trim_options (trim_id, option_id) values (trim_ids[i], v_id); end if;
      end loop;
    end if;
  end loop;
  -- Rules point at other items by position, so they are added once every item has its id.
  foreach l in array lines[2:] loop
    f := string_to_array(l, ';');
    if f[1] in ('P', 'W', 'E', 'I', 'L', 'F') then
      k := k + 1;
      foreach v in array string_to_array(f[6], ',') loop if v <> '' then insert into option_rules values (opt_ids[k], 'cannot combine', opt_ids[v::int + 1]) on conflict do nothing; end if; end loop;
      foreach v in array string_to_array(f[7], ',') loop if v <> '' then insert into option_rules values (opt_ids[k], 'requires', opt_ids[v::int + 1]) on conflict do nothing; end if; end loop;
      foreach v in array string_to_array(f[8], ',') loop if v <> '' then insert into option_rules values (opt_ids[k], 'includes', opt_ids[v::int + 1]) on conflict do nothing; end if; end loop;
    end if;
  end loop;
end $do$;
