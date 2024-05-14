using SyncData.Interface.Serializers;
using SyncData.Repository;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Models.Trees;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Core.Services;

namespace ImportSyncData
{
	//public class Notification  : INotificationHandler<ContentPublishedNotification>
	//{
	//	private IContentSerialize _contentSerialize;
	//	private readonly ILogger<UpdateContent> _logger;
	//	private readonly IPublicAccessService _publicAccessService;
	//	public Notification(IContentSerialize contentSerialize, ILogger<UpdateContent> logger, IPublicAccessService publicAccessService)
	//	{
	//		_contentSerialize = contentSerialize;
	//		_logger = logger;
	//		_publicAccessService = publicAccessService;
	//	}

	//	public void Handle(ContentPublishedNotification notification)
	//	{
	//		var dsd= notification.PublishedEntities.FirstOrDefault();
	//		
	//		//try
	//		//{

	//		//	_contentSerialize.Handler();
	//		//	_logger.LogInformation("Export Content Complete");
	//		//}
	//		//catch (Exception ex)
	//		//{
	//		//	_logger.LogError("Export error when save {ex}", ex);
	//		//}
	//	}
	//}
	//internal class MenuEventEdHandler : INotificationHandler<MenuRenderingNotification>
	//{
	//	private readonly IBackOfficeSecurityAccessor _backOfficeSecurityAccessor;

	//	public MenuEventEdHandler(IBackOfficeSecurityAccessor backOfficeSecurityAccessor)
	//	{
	//		_backOfficeSecurityAccessor = backOfficeSecurityAccessor;
	//	}

	//	public void Handle(MenuRenderingNotification notification)
	//	{
	//		// this example will add a custom menu item for all admin users
	//		if (notification.NodeId == "-20")
	//		{
	//			return;
	//		}           // for all content tree nodes
	//		if (notification.TreeAlias.Equals("content") &&
	//			_backOfficeSecurityAccessor.BackOfficeSecurity.CurrentUser.IsAdmin())
	//		{
				
	//		}
	//	}
	//}
}
