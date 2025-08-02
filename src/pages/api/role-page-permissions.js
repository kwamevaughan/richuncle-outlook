import supabaseAdmin from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  
  if (req.method === 'GET') {
    try {
      // Get all role page permissions with role names
      const { data, error } = await supabaseAdmin
        .from('role_page_permissions')
        .select(`
          *,
          roles (
            id,
            name
          )
        `)
        .order('role_id');

      if (error) {
        console.error('Error fetching role page permissions:', error);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to fetch role page permissions' 
        });
      }

      // Group permissions by role
      const groupedPermissions = {};
      (data || []).forEach(perm => {
        const roleName = perm.roles?.name;
        if (roleName) {
          if (!groupedPermissions[roleName]) {
            groupedPermissions[roleName] = {
              role_name: roleName,
              role_id: perm.role_id,
              page_paths: []
            };
          }
          groupedPermissions[roleName].page_paths.push(perm.page_path);
        }
      });

      return res.status(200).json({ 
        success: true, 
        data: Object.values(groupedPermissions)
      });
    } catch (error) {
      console.error('Error in role page permissions GET:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  if (req.method === 'POST') {
    try {
      const { role_id, page_paths } = req.body;

      console.log('Received data:', { role_id, page_paths });

      if (!role_id || !Array.isArray(page_paths)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Role ID and page paths array are required' 
        });
      }

      // Delete existing permissions for this role
      const { error: deleteError } = await supabaseAdmin
        .from('role_page_permissions')
        .delete()
        .eq('role_id', role_id);

      if (deleteError) {
        console.error('Error deleting existing permissions:', deleteError);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to update permissions' 
        });
      }

      // Insert new permissions - filter out null/undefined/empty values
      const validPagePaths = page_paths.filter(path => 
        path && 
        typeof path === 'string' && 
        path.trim() !== '' && 
        path !== null && 
        path !== undefined
      );

      console.log('Filtered page paths:', validPagePaths);

      if (validPagePaths.length > 0) {
        const permissionsToInsert = validPagePaths.map(page_path => ({
          role_id,
          page_path: page_path.trim()
        }));

        console.log('Permissions to insert:', permissionsToInsert);

        const { error: insertError } = await supabaseAdmin
          .from('role_page_permissions')
          .insert(permissionsToInsert);

        if (insertError) {
          console.error('Error inserting permissions:', insertError);
          return res.status(500).json({ 
            success: false, 
            error: 'Failed to save permissions' 
          });
        }
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Role page permissions updated successfully' 
      });
    } catch (error) {
      console.error('Error in role page permissions POST:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  return res.status(405).json({ 
    success: false, 
    error: 'Method not allowed' 
  });
} 